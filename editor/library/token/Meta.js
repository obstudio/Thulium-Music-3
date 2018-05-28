const FSM = require('./Context')
const NoteSyntax = require('./Note')
const TrackSyntax = require('./Track')

const instDict = require('../Config/Instrument.json')
const percDict = require('../Config/Percussion.json')

const instList = Object.keys(instDict)
const percList = Object.keys(percDict)

const scaleDegrees = ['1', '2', '3', '4', '5', '6', '7']
const defaultPitchDict = [
  { Name: '1', Pitches: 0 },
  { Name: '2', Pitches: 2 },
  { Name: '3', Pitches: 4 },
  { Name: '4', Pitches: 5 },
  { Name: '5', Pitches: 7 },
  { Name: '6', Pitches: 9 },
  { Name: '7', Pitches: 11 }
]

class MetaSyntax extends TrackSyntax {
  constructor(syntax) {
    const note = new NoteSyntax([], scaleDegrees)
    super(syntax)

    this.meta = [
      {
        patt: /^>/,
        pop: true
      },
      {
        patt: /^(\s*)([a-zA-Z][a-zA-Z\d]*)/,
        push: [
          {
            patt: /^(?=>)/,
            pop: true
          },
          {
            patt: /^,/,
            pop: true
          },
          FSM.include('alias'),
          FSM.include('nonalias'),
          {
            patt: /^\[([a-zA-Z])\]/,
            token(match, content) {
              return {
                Type: 'Macropitch',
                Name: match[1]
              }
            }
          },
          {
            patt: /^\[([a-zA-Z])=/,
            push: [
              {
                patt: /^\]/,
                pop: true
              },
              {
                patt: new RegExp('^' + note.pitch()),
                token(match) {
                  return {
                    Pitch: match[1],
                    PitOp: match[2],
                    Chord: match[3],
                    VolOp: match[4]
                  }
                }
              }
            ],
            token(match, content) {
              return {
                Type: 'Macropitch',
                Name: match[1],
                Pitches: content
              }
            }
          },
          FSM.item('Space', /^(\s+)/)
        ],
        token(match, content) {
          return {
            Type: '@inst',
            dict: content.filter(tok => tok.Type === 'Macropitch'),
            spec: content.filter(tok => tok.Type !== 'Macropitch'),
            name: match[2],
            space: match[1]
          }
        }
      }
    ]
  }

  tokenize(string) {
    const instruments = [], warnings = [], degrees = ['0', '%']
    const result = new FSM(this).tokenize(string, 'meta')
    result.Content.forEach(tok => {
      if (instList.includes(tok.name)) {
        if (!degrees.includes('1')) degrees.push(...scaleDegrees)
        const pitchDict = defaultPitchDict.slice()
        const pitchKeys = scaleDegrees.slice()
        tok.dict.forEach(macro => {
          if (pitchKeys.includes(macro.Name)) {
            warnings.push({ Err: 'DupMacroPitch', Args: { Name: macro.Name } })
          } else if (macro.Pitches) {
            pitchDict.push({ Name: macro.Name, Pitches: macro.Pitches })
            pitchKeys.push(macro.Name)
          } else {
            warnings.push({ Err: 'NoPitchDef', Args: { Name: macro.Name } })
          }
          if (!degrees.includes(macro.Name)) {
            degrees.push(macro.Name)
          }
        })
        instruments.push({
          Name: tok.name,
          Spec: tok.spec,
          Dict: pitchDict,
          Space: tok.space
        })
      } else if (percList.includes(tok.name)) {
        if (!degrees.includes('x')) degrees.push('x')
        const pitchData = percDict[tok.name] - 60
        const pitchDict = [{ Name: 'x', Pitches: pitchData }]
        const pitchKeys = ['x']
        tok.dict.forEach(macro => {
          if (pitchKeys.includes(macro.Name)) {
            warnings.push({ Err: 'DupMacroPitch', Args: { Name: macro.Name } })
          } else if (macro.Pitches) {
            warnings.push({ Err: 'PitchDef', Args: { Name: macro.Name } })
          } else {
            pitchDict.push({ Name: macro.Name, Pitches: pitchData })
            pitchKeys.push(macro.Name)
          }
          if (!degrees.includes(macro.Name)) {
            degrees.push(macro.Name)
          }
        })
        instruments.push({
          Name: tok.name,
          Spec: tok.spec,
          Dict: pitchDict,
          Space: tok.space 
        })
      } else {
        warnings.push({ Err: 'NotInstrument', Args: { Name: tok.name } })
      }
    })

    return {
      Instruments: instruments,
      Warnings: warnings,
      Degrees: degrees,
      Index: result.Index
    }
  }
}

module.exports = MetaSyntax
