const TmLoader = require('./Loader')
const { TmSetting } = require('./Object')
const { TrackParser } = require('./Track')
const TmError = require('./Error')
const EPSILON = 0.0000000001

const defaultInstrument = {
  Name: 'Piano',
  Spec: [],
  Dict: [
    { Name: '1', Pitches: 0 },
    { Name: '2', Pitches: 2 },
    { Name: '3', Pitches: 4 },
    { Name: '4', Pitches: 5 },
    { Name: '5', Pitches: 7 },
    { Name: '6', Pitches: 9 },
    { Name: '7', Pitches: 11 }
  ]
}

class Parser {
  /**
   * Tm Parser
   * @param {data} tokenizedData 经过tok的JSON对象
   * @example
   * new Parser(tokenizedData)
   */
  constructor(data) {
    this.Sections = data.Sections
    this.Library = new TmLoader(data.Syntax)
    this.sectionContext = {
      Settings: new TmSetting(),
      PrevFin: undefined
    }
  }

  parse() {
    let homonym = {}
    const result = []
    this.expandSection()
    this.Library.proGlobal(this)
    this.Sections.forEach(token => {
      if (token.Type === 'Section') {
        const dict = {}, data = this.parseSection(token)
        result.push(data)
        data.Tracks.forEach(track => {
          dict[track.Name] = track
          if (track.Name in homonym) {
            this.Library.proMerge(homonym[track.Name], track)
          }
          homonym = dict
        })
      } else {
        this.Library.Package.applyFunction({
          Settings: this.sectionContext.Settings
        }, token)
      }
    })
    return result.filter(section => section.Tracks.length > 0)
  }

  expandSection() {
    const result = []
    for (const section of this.Sections) {
      result.push(...section.Prolog, section, ...section.Epilog)
      delete section.Prolog
      delete section.Epilog
      section.Type = 'Section'
    }
    this.Sections = result
  }

  /**
   * parse section
   * @param {Tm.Section} section
   */
  parseSection(section) {
    const settings = this.sectionContext.Settings.extend()
    for (const setting of section.Settings) {
      for (const token of setting.Spec) {
        if (token.Type === 'Function') {
          this.Library.Package.applyFunction({ Settings: settings }, token)
        }
      }
    }
    const result = [], warnings = [], statistics = {}
    section.Tracks.forEach(track => {
      if (track.Name !== undefined) {
        this.Library.Track[track.Name] = track.Content
      }
      if (track.Play) {
        const trackResult = []
        if (track.Instruments.length === 0) {
          track.Instruments.push(defaultInstrument)
        }
        for (const inst of track.Instruments) {
          const data = new TrackParser(track, inst, settings, this.Library).parse()
          if (inst.Name in statistics) {
            statistics[inst.Name] += 1
          } else {
            statistics[inst.Name] = 1
          }
          data.Name += '.' + String(statistics[inst.Name])
          trackResult.push(data)
        }
        result.push(...trackResult)
      }
    })
    const max = Math.max(...result.map((track) => track.Meta.Duration))
    if (!result.every((track) => Math.abs(track.Meta.Duration - max) < EPSILON)) {
      warnings.push(new TmError('Section::DiffDuration', [], {
        Expected: result.map(() => max),
        Actual: result.map(track => track.Meta.Duration)
      }))
    }
    // const maxBarIni = Math.max(...result.map((track) => track.Meta.BarFirst))
    // const maxBarFin = Math.max(...result.map((track) => track.Meta.BarLast))
    // const ini = result.every((track) => track.Meta.BarFirst === maxBarIni)
    // const fin = result.every((track) => track.Meta.BarLast === maxBarFin)
    // FIXME: ini & fin
    // if (!ini) {
    //   warnings.push(new TmError(TmError.Types.Section.InitiativeBar, [], { Expected: maxBarIni, Actual: sec.Tracks.map((l) => l.Meta.BarFirst) }))
    // }
    // if (!fin && !Number.isNaN(maxBarFin)) {
    //   warnings.push(new TmError(TmError.Types.Section.FinalBar, [], { Expected: maxBarFin, Actual: sec.Tracks.map((l) => l.Meta.BarLast) }))
    // }
    // if (fin && this.sectionContext.PrevFin === undefined) {
    //   this.sectionContext.PrevFin = maxBarFin
    // } else if (fin && ini && maxBarIni !== settings.Bar && this.sectionContext.PrevFin + maxBarIni !== settings.Bar) {
    //   const expected = settings.Bar - this.sectionContext.PrevFin
    //   warnings.push(new TmError(TmError.Types.Section.Mismatch, [], { Expected: expected, Actual: sec.Tracks.map((l) => l.Meta.BarFirst) }))
    //   this.sectionContext.PrevFin = maxBarFin
    // }
    return {
      Tracks: result,
      Warnings: warnings
    }
  }
}

module.exports = Parser
