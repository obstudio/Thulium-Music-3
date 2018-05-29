const Tokenizer = require('./token/Tokenizer')
const Player = require('./player')

const LangDef = {
  tokenizer: require('./Syntax'),
  tokenPostfix: '.tm',
  defaultToken: 'undef'
}

let commandId = ''
function registerPlayCommand(editor) {
  commandId = editor.addCommand(window.monaco.KeyCode.NumLock, (_, result, index, trackIndex) => {
    if (trackIndex === undefined) {
      let secIndex = 0
      new Player({
        Library: result.Library,
        Sections: result.Sections.filter((sec) => sec.Type !== 'Section' || (secIndex++ === index))
      }).play()
    } else {
      let secIndex = 0
      new Player({
        Library: result.Library,
        Sections: result.Sections.filter((sec) => sec.Type !== 'Section' || (secIndex++ === index)).map((sec) => {
          if (sec.Type === 'Section') {
            return {
              Type: 'Section',
              Settings: sec.Settings,
              Tracks: [sec.Tracks[trackIndex]]
            }
          }
          return sec
        })
      }).play()
    }
  }, '')
}

let defined = false
function defineLanguage(scheme) {
  if (!defined) {
    defined = true
  } else {
    return
  }
  window.monaco.languages.register({
    id: 'tm',
    extensions: ['tm']
  })
  window.monaco.editor.defineTheme('tm', {
    base: 'vs-dark',
    inherit: true,
    rules: scheme,
    colors: {}
  })
  window.monaco.editor.setTheme('tm')
  window.monaco.languages.setMonarchTokensProvider('tm', LangDef)
  window.monaco.languages.registerDefinitionProvider('tm', {
    provideDefinition(model, position, token) {
      const matches = model.findMatches('@[A-Za-z0-9]+', false, true, false, '', true)
      const trueMatch = matches.find(
        match =>
          match.range.startLineNumber === position.lineNumber &&
          match.range.endLineNumber === position.lineNumber &&
          match.range.startColumn <= position.column &&
          match.range.endColumn >= position.column
      )
      if (!trueMatch) return
      const def = model.findMatches(`<:${trueMatch.matches[0].slice(1)}:>`, false, false, true, '', false)[0]
      return {
        uri: model.uri,
        range: def.range
      }
    }
  })
  window.monaco.languages.registerCompletionItemProvider('tm', {
    triggerCharacters: ['<', '@'],
    provideCompletionItems(model, position, token) {
      const char = model.getValueInRange({
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: position.column - 1,
        endColumn: position.column
      })
      if (char === '<') {
        return [
          {
            label: 'Piano',
            kind: window.monaco.languages.CompletionItemKind.Variable,
            documentation: 'Piano',
            insertText: 'Piano>'
          }
        ]
      } else if (char === '@') {
        const matches = model.findMatches(
          '<\\*([A-Za-z0-9]+)\\*>',
          false,
          true,
          false,
          '',
          true
        )
        return matches.map(match => ({
          label: match.matches[1],
          kind: window.monaco.languages.CompletionItemKind.Variable,
          insertText: match.matches[1]
        }))
      }
      return [
        {
          label: 'Oct',
          kind: window.monaco.languages.CompletionItemKind.Function,
          insertText: ''
        }
      ]
    }
  })
  window.monaco.languages.registerCodeLensProvider('tm', {
    provideCodeLenses(model, token) {
      model.setEOL(0)
      const content = model.getValue(1)
      const tokenizer = new Tokenizer(content)
      tokenizer.tokenize()
      return tokenizer.sectionIndex.map((ind, i) => {
        const position = model.getPositionAt(tokenizer.baseIndex + ind)
        return {
          range: {
            startLineNumber: position.lineNumber,
            startColumn: position.column,
            endLineNumber: position.lineNumber,
            endColumn: position.column
          },
          id: `Section ${i + 1}`,
          command: {
            id: commandId,
            title: `Section ${i + 1}`,
            arguments: [tokenizer.result, i]
          }
        }
      }).concat(...tokenizer.trackIndex.map((tracks, index) => {
        const base = tokenizer.baseIndex + tokenizer.sectionIndex[index]
        return tracks.map((track, i) => {
          const position = model.getPositionAt(track + base)
          return {
            range: {
              startLineNumber: position.lineNumber,
              startColumn: position.column,
              endLineNumber: position.lineNumber,
              endColumn: position.column
            },
            id: `Section ${index} Track ${i + 1}`,
            command: {
              id: commandId,
              title: `Track ${i + 1}`,
              arguments: [tokenizer.result, index, i]
            }
          }
        })
      }))
    },
    resolveCodeLens(model, codeLens, token) {
      return codeLens
    }
  })
}

module.exports = { defineLanguage, registerPlayCommand }