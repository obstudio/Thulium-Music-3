const TmError = require('./Error')
const { TmSetting, TmMeta } = require('./Object')
const { NoteParser, PitchParser } = require('./Note')

function equal(x, y) {
  return Math.abs(x - y) < 0.0000001
}

class TrackParser {
  constructor(track, instrument, sectionSettings, library) {
    this.Name = track.Name
    this.Instrument = instrument
    this.Library = library
    this.Source = track.Content
    this.Settings = sectionSettings.extend()
    this.Meta = new TmMeta().extend(library.Meta.Initial)
    this.Notation = library.Notation()
    this.Warnings = []
  }

  pushError(errorType, args, useLocator = true) {
    this.Warnings.push(new TmError(errorType, useLocator ? {
      Bar: this.Meta.BarCount,
      Index: this.Meta.Index
    } : {}, args))
  }

  parse() {
    this.Library.Pitch = {}
    this.Instrument.Dict.forEach(macro => {
      if (!(macro.Pitches instanceof Array)) {
        this.Library.Pitch[macro.Name] = Object.assign([{
          Pitch: macro.Pitches
        }], { Generated: true })
      } else {
        const data = new PitchParser(
          { Pitch: macro.Pitches },
          this.Library,
          new TmSetting()
        ).checkParse()
        this.Library.Pitch[macro.Name] = data.Result
        if (data.Warnings.length > 0) {
          this.pushError('Library::PitchInit', { Warnings: data.Warnings }, false)
        }
      }
    })
    this.Source = [...this.Instrument.Spec, ...this.Source]
    const result = this.parseContent()
    const terminal = this.Warnings.findIndex(err => {
      return err.name === 'Track::BarLength' && err.pos.Bar === this.Meta.BarCount
    })
    if (terminal > -1 && equal(this.Warnings[terminal].arg.Time, this.Meta.Duration)) {
      this.Warnings.splice(terminal, 1)
    }

    if (result.Meta.Duration < this.Settings.FadeIn) {
      this.pushError(TmError.Types.Track.FadeOverLong, { Actual: this.Settings.FadeIn }, false)
    }
    if (result.Meta.Duration < this.Settings.FadeOut) {
      this.pushError(TmError.Types.Track.FadeOverLong, { Actual: this.Settings.FadeOut }, false)
    }
    result.Effects = this.Settings.effects
    result.Instrument = this.Instrument.Name
    if (!this.Name) this.Name = ''
    result.Name = `${this.Name}.${this.Instrument.Name}`
    return result
  }

  // FIXME: static?
  // FIXME: merge notation
  mergeMeta(dest, src) {
    dest.Meta.PitchQueue = src.Meta.PitchQueue
    dest.Warnings.push(...src.Warnings.map(warning => {
      warning.pos.unshift(Object.assign({}, {
        Bar: dest.Meta.BarCount,
        Index: dest.Meta.Index
      }))
      return warning
    }))
    if (src.Meta.BarCount === 0) {
      if (dest.Meta.BarCount === 0) {
        dest.Meta.BarFirst += src.Meta.BarFirst
        if (dest.isLegalBar(dest.Meta.BarFirst)) {
          dest.Meta.BarCount += 1
        }
      } else {
        dest.Meta.BarLast += src.Meta.BarFirst
        if (dest.isLegalBar(dest.Meta.BarLast)) {
          dest.Meta.BarLast = 0
        }
      }
    } else {
      if (dest.Meta.BarCount === 0) {
        dest.Meta.BarFirst += src.Meta.BarFirst
        dest.Meta.BarCount += 1
        dest.Meta.BarLast = src.Meta.BarLast
        if (dest.isLegalBar(dest.Meta.BarLast)) {
          dest.Meta.BarLast = 0
        }
      } else {
        dest.Meta.BarLast += src.Meta.BarFirst // problematic
        if (!dest.isLegalBar(dest.Meta.BarLast)) {
          dest.pushError(TmError.Types.Track.BarLength, {
            Expected: dest.Settings.Bar,
            Actual: dest.Meta.BarFirst
          })
        }
        dest.Meta.BarLast = src.Meta.BarLast
        if (dest.isLegalBar(dest.Meta.BarLast)) {
          dest.Meta.BarLast = 0
        }
      }
    }
    // FIXME: merge warnings
  }

  parseContent(source = this.Source) {
    this.Content = []
    for (const token of source) {
      this.Meta.Index += 1
      switch (token.Type) {
      case 'Function':
      case 'Subtrack': 
      case 'Macrotrack': {
        let subtracks
        if (token.Type === 'Function') {
          subtracks = [this.Library.Package.applyFunction(this, token)]
          if (subtracks[0] === undefined) {
            break
            // FIXME: Test && Report Error ?
          }
        } else if (token.Type === 'Macrotrack') {
          if (token.Name in this.Library.Track) {
            subtracks = new SubtrackParser({
              Type: 'Subtrack',
              Content: this.Library.Track[token.Name]
            }, this.Settings, this.Library, this.Meta).parse()
          } else {
            // FIXME: Report Error
            throw new Error(token.Name + ' not found')
          }
        } else {
          subtracks = new SubtrackParser(token, this.Settings, this.Library, this.Meta).parse()
        }
        this.Library.proMerge(this, ...subtracks)
        subtracks.forEach(subtrack => {
          this.mergeMeta(this, subtrack)
          subtrack.Content.forEach(note => {
            note.StartTime += this.Meta.Duration
          })
        })
        const max = Math.max(...subtracks.map(subtrack => subtrack.Meta.Duration))
        if (!subtracks.every(subtrack => equal(subtrack.Meta.Duration, max))) {
          this.Warnings.push(new TmError('Track::DiffDuration', {}, {
            Expected: subtracks.map(() => max),
            Actual: subtracks.map(subtrack => subtrack.Meta.Duration)
          }))
        }
        this.Meta.Duration += max
        this.Content.push(...[].concat(...subtracks.map(subtrack => subtrack.Content)))
        break
      }
      case 'Note': {
        const note = new NoteParser(token, this.Library, this.Settings, this.Meta).parse()
        if (this.Meta.BarCount === 0) {
          this.Meta.BarFirst += note.Beat
        } else {
          this.Meta.BarLast += note.Beat
        }
        this.Warnings.push(...note.Warnings)
        this.Content.push(...note.Result)
        break
      }
      case 'BarLine':
        if (this.Meta.BarLast > 0) {
          this.Meta.BarCount += 1
        }
        if (!this.isLegalBar(this.Meta.BarLast)) {
          this.pushError(TmError.Types.Track.BarLength, {
            Expected: this.Settings.Bar,
            Actual: this.Meta.BarLast,
            Time: this.Meta.Duration
          })
        }
        this.Meta.BarLast = 0
        break
      case 'Clef':
      case 'Comment':
      case 'Space':
        break
      default:
        const attributes = this.Library.Types[token.Type]
        if (attributes.preserve) {
          this.Notation[attributes.class].push({
            Type: token.Type,
            Bar: this.Meta.BarCount,
            Index: this.Meta.Index,
            Time: this.Meta.Duration
          })
        }
        this.Meta.After[token.Type] = true
      }
    }
    this.Library.epiTrack(this)
    return {
      Notation: this.Notation,
      Content: this.Content,
      Warnings: this.Warnings,
      Settings: this.Settings,
      Meta: this.Meta
    }
  }

  isLegalBar(bar) {
    return bar === undefined || equal(bar, this.Settings.Bar) || bar === 0
  }
}

class SubtrackParser extends TrackParser {
  constructor(track, settings, library, meta) {
    super(track, null, settings, library)
    this.Meta.PitchQueue = meta.PitchQueue
    this.Meta.After = Object.assign({}, meta.After)
    for (const attr of library.Meta.Preserved) {
      this.Meta[attr] = meta[attr]
    }
    this.Repeat = track.Repeat
  }

  parse() {
    this.preprocess()
    const meta = this.Meta
    const settings = this.Settings
    // FIXME: overlay security
    const results = []
    let lastIndex = 0
    this.Source.forEach((token, index) => {
      if (token.Type === 'BarLine' && token.Overlay) {
        this.Meta = meta.extend()
        this.Settings = settings.extend()
        results.push(this.parseContent(this.Source.slice(lastIndex, index)))
        lastIndex = index + 1
        this.Meta.Duration = 0 // FIXME: this.Settings
      }
    })
    this.Meta = meta.extend()
    this.Settings = settings.extend()
    results.push(this.parseContent(this.Source.slice(lastIndex)))
    return results
  }

  preprocess() {
    if (this.Repeat === undefined) this.Repeat = -1
    if (this.Repeat > 0) {
      this.Source.forEach((token, index) => {
        if (token.Type === 'BarLine' && token.Skip) {
          this.Warnings.push(new TmError(TmError.Types.Track.UnexpCoda, { Index: index }, { Actual: token }))
        }
      })
      const temp = []
      const repeatArray = this.Source.filter(token => token.Type === 'BarLine' && token.Order[0] !== 0)
      const defaultOrder = repeatArray.find(token => token.Order.length === 0)
      if (defaultOrder !== undefined) {
        const order = [].concat(...repeatArray.map((token) => token.Order))
        for (let i = 1; i < this.Repeat; i++) {
          if (order.indexOf(i) === -1) defaultOrder.Order.push(i)
        }
      }
      for (let i = 1; i <= this.Repeat; i++) {
        let skip = false
        for (const token of this.Source) {
          if (token.Type !== 'BarLine' || token.Order[0] === 0) {
            if (!skip) {
              temp.push(token)
            }
          } else if (token.Order.indexOf(i) === -1) {
            skip = true
          } else {
            skip = false
            temp.push(token)
          }
        }
        temp.push({
          Type: 'BarLine',
          Skip: false,
          Order: [0]
        })
      }
      this.Source = temp
    } else {
      this.Source.forEach((token, index) => {
        if (token.Order instanceof Array && (token.Order.length !== 1 || token.Order[0] !== 0)) {
          this.Warnings.push(new TmError(TmError.Types.Track.UnexpVolta, { index }, { Actual: token }))
        }
      })
      if (this.Repeat !== -1 && this.Source.length >= 1) {
        const last = this.Source[this.Source.length - 1]
        if (last.Type !== 'BarLine') {
          this.Source.push({
            Type: 'BarLine',
            Skip: false,
            Order: [0]
          })
        }
      }
      const skip = this.Source.findIndex((tok) => tok.Skip === true)
      for (let index = skip + 1, length = this.Source.length; index < length; index++) {
        if (this.Source[index].Skip === true) {
          this.Warnings.push(new TmError(TmError.Types.Track.MultiCoda, { index }, {}))
        }
      }
      let temp
      if (skip === -1) {
        temp = new Array(-this.Repeat).fill(this.Source)
      } else {
        temp = new Array(-this.Repeat - 1).fill(this.Source)
        temp.push(this.Source.slice(0, skip))
      }
      this.Source = [].concat(...temp)
    }
  }
}

module.exports = {
  TrackParser,
  SubtrackParser
}
