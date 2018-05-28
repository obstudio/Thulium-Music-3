class NoteSyntax {
  static ArrayToRegExp(array, multi = true) {
    let charset = '', quantifier = ''
    if (array.length > 0) {
      if (multi) quantifier = '*'
      charset = '[' + array.join('') + ']'
    }
    return charset + quantifier
  }

  constructor(chords, degrees) {
    const normal = degrees.includes('1')
    this.exist = degrees.length > 0
    this.degree = NoteSyntax.ArrayToRegExp(degrees, false)
    this.chord = normal ? NoteSyntax.ArrayToRegExp(chords, true) : ''
    const pitOp = normal ? "[#b',]*" : ''
    const durOp = '[._=-]*'
    const volOp = '[>:]*'
    const epilog = '[`]*'
    const inner = `(?:${pitOp}${this.chord}${volOp})`
    const outer = `(?:${durOp}${epilog})`
    this.deg = `(${this.degree})`
    this.in = `(${pitOp})(${this.chord})(${volOp})`
    this.out = `(${durOp})(${epilog})`
    this.sqr = `\\[((?:${this.degree}${inner})+)\\]`
    this.Patt = `(?:(?:\\[(?:${this.degree}${inner})+\\]|${this.degree})${inner}${outer})`
  }

  pattern() {
    return this.Patt
  }

  pitch() {
    return this.deg + this.in
  }

  context() {
    const deg = this.deg
    const _in = this.in
    const out = this.out
    const sqr = this.sqr
    return this.exist ? [
      {
        patt: new RegExp('^' + deg + _in + out),
        token(match) {
          return {
            Type: 'Note',
            Pitch: [
              {
                Pitch: match[1],
                PitOp: match[2],
                Chord: match[3],
                VolOp: match[4]
              }
            ],
            PitOp: '',
            Chord: '',
            VolOp: '',
            DurOp: match[5],
            Stac: match[6].length
          }
        }
      },
      {
        patt: new RegExp('^' + sqr + _in + out),
        token(match) {
          const inner = new RegExp(deg + _in)
          const match1 = match[1].match(new RegExp(inner, 'g'))
          return {
            Type: 'Note',
            Pitch: match1.map(str => {
              const match = inner.exec(str)
              return {
                Pitch: match[1],
                PitOp: match[2],
                Chord: match[3],
                VolOp: match[4]
              }
            }),
            PitOp: match[2],
            Chord: match[3],
            VolOp: match[4],
            DurOp: match[5],
            Stac: match[6].length
          }
        }
      }
    ] : []
  }
}

module.exports = NoteSyntax
