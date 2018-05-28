const FSM = require('./Context')
const NoteSyntax = require('./Note')
const TmLibrary = require('./Library')
const { TmAlias } = require('./Alias')

const ArgumentPatterns = {
  uns: {
    patt: '(\\d+(?:\\.\\d+)?)',
    meta: 'Expression'
  },
  sig: {
    patt: '([+\\-]\\d+(?:\\.\\d+)?)',
    meta: 'Expression'
  },
  int: {
    patt: '([+\\-]?\\d+(?:\\.\\d+)?)',
    meta: 'Expression'
  },
  exp: {
    patt: '([+\\-]?\\d+(?:[./]\\d+)?|Log2\\(\\d+\\)(?:[+\\-]\\d+)?)',
    meta: 'Expression'
  },
  str: {
    patt: '((?:[^\\{\\}\\(\\)\\[\\]\\"\\,]|\\\\.)*)',
    meta: 'String'
  },
  nam: {
    patt: '([a-zA-Z][a-zA-Z\\d]*)',
    meta: 'String'
  },
  mac: {
    patt: '(@[a-zA-Z]\\w*)',
    meta: 'Macrotrack'
  }
}

class TrackSyntax {
  constructor(syntax, degrees = []) {
    const name = syntax.Dict.map(func => func.Name).join('|')
    const chords = syntax.Chord.map(chord => chord.Notation)
    const note = new NoteSyntax(chords, degrees)
    const dict = Object.assign({
      not: {
        patt: '(' + note.pattern() + '+)',
        meta: 'Subtrack',
        epilog: arg => this.tokenize(arg, 'note').Content
      }
    }, ArgumentPatterns)

    // Notes
    this.note = note.context()

    // Non-alias Functions
    this.nonalias = [
      {
        patt: new RegExp(`^(${name})\\(`),
        push: 'argument',
        token(match, content) {
          return {
            Type: 'Function',
            Name: match[1],
            Alias: -1,
            Args: content,
            VoidQ: syntax.Dict.find(func => func.Name === match[1]).VoidQ
          }
        }
      },
      {
        patt: new RegExp(`^\\((${name}):`),
        push: 'argument',
        token(match, content) {
          return {
            Type: 'Function',
            Name: match[1],
            Alias: 0,
            Args: content,
            VoidQ: syntax.Dict.find(func => func.Name === match[1]).VoidQ
          }
        }
      }
    ]

    // Subtrack & Macrotrack & PlainFunction
    this.proto = [
      {
        patt: /^\{(?:(\d+)\*)?/,
        push: 'default',
        token(match, content) {
          let repeat
          if (match[1] !== undefined) {
            repeat = parseInt(match[1])
          } else {
            const volta = content.filter(tok => tok.Type === 'BarLine' && tok.Order[0] > 0)
            repeat = Math.max(-1, ...volta.map(tok => Math.max(...tok.Order)))
          }
          return {
            Type: 'Subtrack',
            Repeat: repeat,
            Content: content
          }
        }
      },
      {
        patt: /^@([a-zA-Z]\w*)/,
        token(match) {
          return {
            Type: 'Macrotrack',
            Name: match[1]
          }
        }
      },
      FSM.include('nonalias')
    ];

    // Section Notations
    this.section = [
      FSM.item('LocalIndicator', /^!/)
    ];

    this.volta = [
      {
        patt: /^(\d+)~(\d+)/,
        token(match) {
          const result = []
          for (let i = parseInt(match[1]); i <= parseInt(match[2]); i++) {
            result.push(i)
          }
          return result
        }
      },
      {
        patt: /^\d+/,
        token: match => parseInt(match[0])
      },
      {
        patt: /^[.,] */
      }
    ];

    // Track Contents
    this.default = [
      FSM.include('alias'),
      FSM.include('proto'),
      FSM.include('note'),
      FSM.include('section'),
      {
        patt: /^\}/,
        pop: true
      },
      {
        patt: /^\\(?=(\d+(~\d+)?(, *\d+(~\d+)?)*)?:)/,
        push: FSM.next('volta', /^:/),
        token(match, content) {
          return {
            Type: 'BarLine',
            Skip: false,
            Overlay: false,
            Order: [].concat(...content)
          }
        },
        locate: false
      },
      {
        patt: /^(\/|\||\\)/,
        token(match) {
          return {
            Type: 'BarLine',
            Skip: match[0] === '\\',
            Overlay: match[0] === '/',
            Order: [0]
          }
        }
      },
      {
        patt: /^<\*/,
        push: [
          {
            patt: /^\*>/,
            pop: true
          },
          FSM.item('@literal', /^(.)/)
        ],
        token(match, content) {
          return {
            Type: 'Comment',
            Content: content.map(tok => tok.Content).join('')
          }
        }
      },
      FSM.item('Tie', /^\^/),
      FSM.item('Space', /^(\s+)/)
    ];

    this.argument = [
      {
        patt: /^\)/,
        pop: true
      },
      {
        patt: /^, */
      },
      {
        patt: /^\[/,
        push: FSM.next('argument', /^\]/),
        token(match, content) {
          return {
            Type: 'Array',
            Content: content
          }
        }
      },
      {
        patt: /^"(([^\{\}\(\)\[\]\"\,]|\\.)*)"/,
        token(match) {
          return {
            Type: 'String',
            Content: match[1].replace(/\\(?=.)/, '')
          }
        }
      },
      FSM.item('Expression', /^([+\-]?\d+([./]\d+)?|Log2\(\d+\)([+\-]\d+)?)/),
      FSM.include('proto')
    ]
    this.alias = syntax.Alias.map(alias => new TmAlias(alias).build(dict))
    TmLibrary.loadContext(this, syntax.Context)
  }

  tokenize(string, state, epi = true) {
    return new FSM(this).tokenize(string, state, epi);
  }
}

module.exports = TrackSyntax
