module.exports = {
  root: [
    {
      regex: /\/\/.*/,
      action: {
        token: 'comment'
      }
    },
    {
      regex: /# *Track/,
      action: {
        token: '@rematch',
        next: 'Macro'
      }
    },
    {
      regex: /# *Chord/,
      action: {
        token: '@rematch',
        next: 'ChordDef'
      }
    },
    {
      regex: /# *Function/,
      action: {
        token: 'macro',
        next: 'Function',
        nextEmbedded: 'text/javascript'
      }
    },
    {
      regex: /# *Include/,
      action: {
        token: '@rematch',
        next: '@Inc'
      }
    },
    {
      regex: /# *End/,
      action: {
        token: 'macro',
        bracket: '@close'
      }
    },
    {
      regex: /\[(\d+\.)+\]/,
      action: {
        token: 'volta'
      }
    },
    {
      regex: /<[^:*]+>/,
      action: {
        token: 'instr'
      }
    },
    {
      include: 'Common'
    }
  ],
  Subtrack: [
    {
      regex: /\d+\*|\\\d*:/,
      action: {
        token: 'repeat'
      }
    },
    {
      regex: /\/|\\/,
      action: {
        token: 'repeat'
      }
    },
    {
      regex: /\^\)|\)/,
      action: {
        token: '@rematch',
        next: '@pop'
      }
    },
    {
      include: 'Common'
    }
  ],
  Common: [
    {
      regex: /@[A-Za-z\d]+/,
      action: {
        token: 'macroIndicator'
      }
    },
    {
      regex: /(\$?)([\d%x])/,
      action: [
        {
          token: 'func'
        },
        {
          cases: {
            '@eos': {
              token: 'degree'
            },
            '@default': {
              token: 'degree',
              next: 'NoteOp'
            }
          }
        }
      ]
    },
    {
      regex: /(\$?)(\[)/,
      action: [
        {
          token: 'func'
        },
        {
          token: '@rematch',
          next: 'Chord'
        }
      ]
    },
    {
      regex: /\(/,
      action: {
        token: '@rematch',
        next: 'Sfunc'
      }
    },
    {
      regex: /([A-Z][a-z]+)+\(/,
      action: {
        token: '@rematch',
        next: 'Func'
      }
    },
    {
      regex: /{/,
      action: {
        bracket: '@open',
        token: '@bracket',
        next: 'Subtrack'
      }
    },
    {
      regex: /}/,
      action: {
        bracket: '@close',
        token: '@bracket',
        next: '@pop'
      }
    },
    {
      regex: /&/,
      action: {
        token: 'press-release'
      }
    },
    {
      regex: /\*/,
      action: {
        token: 'press-release'
      }
    },
    {
      regex: /~/,
      action: {
        token: 'func'
      }
    },
    {
      regex: /\^/,
      action: {
        token: 'tie'
      }
    },
    {
      regex: /:\|\|:|:\|\||\|\|:|\|\||\|/,
      action: {
        token: 'barline'
      }
    }
  ],
  Sfunc: [
    {
      regex: /\(\.\)/,
      action: {
        token: 'func',
        next: '@pop'
      }
    },
    {
      regex: /\(\^/,
      action: {
        token: 'func',
        next: 'Subtrack'
      }
    },
    {
      regex: /\(|\^|:|1=|~/,
      action: {
        token: 'func'
      }
    },
    {
      regex: /{/,
      action: {
        token: '@bracket',
        next: 'Subtrack'
      }
    },
    {
      regex: /[^)]+\^\)/,
      action: {
        token: '@rematch',
        next: 'Subtrack'
      }
    },
    {
      regex: /\^\)/,
      action: {
        token: 'func',
        next: '@pop'
      }
    },
    {
      regex: /\)/,
      action: {
        token: 'func',
        next: '@pop'
      }
    },
    {
      regex: /[A-Za-zb#%\d.\-/]/,
      action: {
        token: 'number'
      }
    }
  ],
  Func: [
    {
      regex: /[A-Z][a-z]+/,
      action: {
        token: 'func'
      }
    },
    {
      regex: /\(/,
      action: {
        token: 'func',
        next: 'Arg'
      }
    },
    {
      regex: /\)/,
      action: {
        token: 'func',
        next: '@pop'
      }
    },
    {
      regex: /,\s*/,
      action: {
        token: 'func',
        next: 'Arg'
      }
    }
  ],
  Array: [
    {
      regex: /\[/,
      action: {
        token: 'func',
        bracket: '@open',
        next: 'Arg'
      }
    },
    {
      regex: /,\s*/,
      action: {
        token: 'func',
        next: 'Arg'
      }
    },
    {
      regex: /\]/,
      action: {
        token: 'func',
        bracket: '@close',
        next: '@pop'
      }
    }
  ],
  Arg: [
    {
      regex: /{/,
      action: {
        token: '@bracket',
        next: 'Subtrack'
      }
    },
    {
      regex: /"[^"]*"/,
      action: {
        token: 'string'
      }
    },
    {
      regex: /\[/,
      action: {
        token: '@rematch',
        next: 'Array'
      }
    },
    {
      regex: /,|\)|\]/,
      action: {
        token: '@rematch',
        next: '@pop'
      }
    },
    {
      regex: /\d+\/\d+|\d+(\.\d+)?|Log2\(\d+\)([+-]\d+)?/,
      action: {
        token: 'number'
      }
    }
  ],
  NoteOp: [
    {
      regex: /[^',b#a-wyzA-Z\-_.=`:>]/,
      action: {
        token: '@rematch',
        next: '@pop'
      }
    },
    {
      include: 'NoteAddon'
    }
  ],
  NoteAddon: [
    {
      regex: /[',b#a-wyzA-Z]/,
      action: {
        cases: {
          '@eos': {
            token: 'pitOp-chord',
            next: '@pop'
          },
          '@default': {
            token: 'pitOp-chord'
          }
        }
      }
    },
    {
      regex: /[-_.=`:>]/,
      action: {
        cases: {
          '@eos': {
            token: 'durOp-stac-volOp',
            next: '@pop'
          },
          '@default': {
            token: 'durOp-stac-volOp'
          }
        }
      }
    }
  ],
  Chord: [
    {
      regex: /\[/,
      action: {
        token: '@rematch',
        next: 'ChordInside'
      }
    },
    {
      regex: /[^',b#a-wyzA-Z\-_.=`:>]/,
      action: {
        token: '@rematch',
        next: '@pop'
      }
    },
    {
      include: 'NoteAddon'
    }
  ],
  ChordInside: [
    {
      regex: /\[/,
      action: {
        token: 'chordBracket'
      }
    },
    {
      regex: /[\d%]/,
      action: {
        token: 'degree'
      }
    },
    {
      regex: /[',b#a-wyzA-Z]/,
      action: {
        token: 'pitOp-chord'
      }
    },
    {
      regex: /[:>]/,
      action: {
        token: 'durOp-stac-volOp'
      }
    },
    {
      regex: /\]/,
      action: {
        token: 'chordBracket',
        next: '@pop'
      }
    }
  ],
  ChordDef: [
    {
      regex: /# *Chord/,
      action: {
        token: 'macro',
        bracket: '@open'
      }
    },
    {
      regex: /#/,
      action: {
        token: '@rematch',
        bracket: '@close',
        next: '@pop'
      }
    },
    {
      regex: /^.+$/,
      action: {
        token: '@rematch',
        next: 'ChordDefLine'
      }
    }
  ],
  ChordDefLine: [
    {
      regex: /^[a-wyzA-Z]/,
      action: {
        token: 'pitOp-chord'
      }
    },
    {
      regex: /\t+[^\t]+\t+/,
      action: {
        token: 'comment'
      }
    },
    {
      regex: /.*/,
      action: {
        token: 'pitOp-chord',
        next: '@pop'
      }
    }
  ],
  Macro: [
    {
      regex: /# *Track/,
      action: {
        token: 'macro',
        bracket: '@open'
      }
    },
    {
      regex: /#/,
      action: {
        token: '@rematch',
        bracket: '@close',
        next: '@pop'
      }
    },
    {
      regex: /<:[A-Za-z\d]+:>/,
      action: {
        token: 'macroIndicator'
      }
    },
    {
      include: 'Common'
    }
  ],
  Function: [
    {
      regex: /#/,
      action: {
        token: '@rematch',
        bracket: '@close',
        next: '@pop',
        nextEmbedded: '@pop'
      }
    }
  ],
  Inc: [
    {
      regex: /# *Include/,
      action: {
        token: 'inc'
      }
    },
    {
      regex: /".*"/,
      action: {
        token: 'incPath',
        next: '@pop'
      }
    }
  ],
  Section: [],
  Track: []
}