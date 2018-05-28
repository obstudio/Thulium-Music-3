const TmError = require('./Error')

class PitchParser {
  constructor({
    Pitch,
    PitOp = '',
    Chord = '',
    VolOp = ''
  }, library, settings, pitchQueue = []) {
    this.Pitch = Pitch
    this.PitOp = PitOp
    this.Chord = Chord
    this.VolOp = VolOp
    this.Library = library
    this.Settings = settings
    this.PitchQueue = pitchQueue
    this.Warnings = []
  }

  parse() {
    this.parsePitch()
    this.parsePitVol()
    this.parseChord()
    return {
      Result: this.Result,
      Warnings: this.Warnings
    }
  }

  parsePitch() {
    if (this.Pitch instanceof Array) {
      this.Result = [].concat(...this.Pitch.map(pitch => {
        const data = new PitchParser(pitch, this.Library, this.Settings, this.PitchQueue).parse()
        this.Warnings.push(...data.Warnings)
        return data.Result
      }))
    } else {
      if (this.Library.Pitch[this.Pitch] !== undefined) {
        this.Result = this.Library.Pitch[this.Pitch].map(note => Object.assign({}, note))
        this.Result.forEach(note => {
          if (note.Volume === undefined) note.Volume = 1
          note.Volume *= this.Settings.Volume
        })
        if ('1' <= this.Pitch && this.Pitch <= '9') {
          this.Result.forEach(note => {
            note.Fixed = false
            note.Pitch += this.Settings.Key
          })
        } else {
          this.Result.forEach(note => {
            note.Fixed = true
          })
        }
      } else if (this.Pitch === '%') {
        if (this.PitchQueue.length >= this.Settings.Trace) {
          const trace = this.PitchQueue[this.PitchQueue.length - this.Settings.Trace]
          this.Result = trace.map(note => {
            return {
              Pitch: note.Pitch,
              Volume: note.Volume / trace[0].Volume * this.Settings.Volume,
              Fixed: false
            }
          })
        } else {
          this.Result = []
          this.report('Note::NoPrevious', { Trace: this.Settings.Trace })
        }
      } else {
        this.Result = []
      }
    }
  }

  parsePitVol() {
    const delta = this.PitOp.split('').reduce((sum, op) => {
      return sum + { '#': 1, 'b': -1, '\'': 12, ',': -12 }[op]
    }, 0)
    const scale = this.VolOp.split('').reduce((prod, op) => {
      return prod * (op === '>' ? this.Settings.Accent : this.Settings.Light)
    }, 1)
    this.Result.forEach(note => {
      note.Volume *= scale
      if (!note.Fixed) {
        note.Pitch += delta
      }
    })
  }

  parseChord() {
    this.Result = this.Chord.split('').reduce((notes, op) => {
      const chord = this.Library.Chord[op]
      const result = []
      const length = notes.length
      const used = new Array(length).fill(false)
      let flag = true
      chord.forEach(([head, tail, delta]) => {
        if (!flag) return
        if (head < -length || head >= length || tail < -length || tail >= length) {
          this.report('Note::ChordRange', { Length: length, Head: head, Tail: tail })
          return flag = false
        }
        if (head < 0) head += length
        if (tail < 0) tail += length
        if (head > tail) {
          this.report('Note::ChordRange', { Length: length, Head: head, Tail: tail })
          return flag = false
        }
        for (let i = head; i <= tail; i++) used[i] = true
        const interval = notes.slice(head, tail + 1).map(obj => Object.assign({}, obj))
        interval.forEach(note => {
          if (!note.Fixed) note.Pitch += delta
        })
        if (interval.some(note => note.Fixed)) {
          this.report('Note::OnFixedNote', { Chord: op, Notes: interval })
          return flag = false
        }
        result.push(...interval)
      })
      if (used.some(item => !item)) {
        this.report('Note::UnusedNote', { Chord: op, Notes: notes })
      }
      if (flag) {
        return result
      } else {
        return notes
      }
    }, this.Result)
  }

  report(type, args = {}) {
    this.Warnings.push(new TmError(type, {}, args))
  }

  static checkDuplicate(result) {
    const length = result.length
    let i = -1
    while (i++ < length) {
      for (let j = i + 1; j < length; ++j) {
        if (result[i].Pitch === result[j].Pitch) return true
      }
    }
    return false
  }

  static checkVolume(result) {
    let flag = false
    result.forEach(note => {
      if (note.Volume > 1) {
        note.Volume = 1
        flag = true
      }
    })
    return flag
  }

  checkParse() {
    this.parse()
    if (PitchParser.checkDuplicate(this.Result)) {
      this.report('Note::Reduplicate', { Pitches: this.Result.map(note => note.Pitch) })
    }
    if (PitchParser.checkVolume(this.Result)) {
      this.report('Note::VolumeRange', { Volumes: this.Result.map(note => note.Volume) })
    }
    return {
      Result: this.Result,
      Warnings: this.Warnings
    }
  }
}

class NoteParser {
  constructor(note, library, settings, meta) {
    this.Stac = note.Stac
    this.DurOp = note.DurOp
    this.Library = library
    this.Settings = settings
    this.Meta = meta
    this.Position = {
      Bar: this.Meta.BarCount,
      Index: this.Meta.Index
    }
    const data = new PitchParser(note, library, settings, meta.PitchQueue).checkParse()
    this.Result = data.Result
    this.Warnings = data.Warnings
    this.Warnings.forEach(err => err.pos = this.Position)
  }

  report(type, args = {}) {
    this.Warnings.push(new TmError(type, this.Position, args))
  }

  parse() {
    const beat = this.parseBeat()
    const duration = beat * 60 / this.Settings.Speed

    let scale
    if (this.Stac > this.Settings.Stac.length) {
      scale = 1
      this.report('Note::NoStacRef', {
        Length: this.Settings.Stac.length,
        Actual: this.Stac
      })
    } else {
      scale = 1 - this.Settings.Stac[this.Stac] 
    }

    if (this.Result.length > 0) {
      this.Meta.PitchQueue.push(this.Result.slice())
    }
    this.Result.forEach(note => {
      note.StartTime = this.Meta.Duration
      note.Duration = duration * scale
      delete note.Fixed
    })
    this.Meta.Duration += duration
    this.Library.epiNote(this)
    return {
      Beat: beat,
      Result: this.Result,
      Warnings: this.Warnings
    }
  }

  parseBeat() {
    let beat = 1
    let pointer = 0
    const length = this.DurOp.length
    while (pointer < length) {
      const char = this.DurOp.charAt(pointer)
      pointer += 1
      switch (char) {
      case '=':
        beat /= 4
        break
      case '-':
        beat += 1
        break
      case '_':
        beat /= 2
        break
      case '.':
        let dotCount = 1
        while (this.DurOp.charAt(pointer) === '.') {
          dotCount += 1
          pointer += 1
        }
        beat *= 2 - Math.pow(2, -dotCount)
        break
      }
    }
    return beat * Math.pow(2, -this.Settings.Duration)
  }
}

module.exports = { NoteParser, PitchParser }
