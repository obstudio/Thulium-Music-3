const Player = require('../player')
const Thulium = require('../Thulium')
const Language = require('./Language')

let commandId = ''
function registerPlayCommand(editor) {
  commandId = editor.addCommand(window.monaco.KeyCode.NumLock, (_, result, index, trackIndex) => {
    if (trackIndex === undefined) {
      new Player(result, index).play()
    } else {
      new Player(result, {index, Tracks: trackIndex}).play()
    }
  }, '')
}

function codeLensAt(model, line, id, command) {
  const position = model.getPositionAt(line)
  return {
    range: {
      startLineNumber: position.lineNumber,
      startColumn: position.column,
      endLineNumber: position.lineNumber,
      endColumn: position.column
    },
    id, command
  }
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
  window.monaco.languages.setMonarchTokensProvider('tm', Language)
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
      const index = new Thulium(content, { useFile: false }).Index
      return [].concat(...index.sections.map((section, sIndex) => {
        const result = section.tracks.map((track, tIndex) => 
          codeLensAt(model, index.base + section.start + track, `Section ${sIndex + 1} Track ${tIndex + 1}`, {
            id: commandId,
            title: `Track ${tIndex + 1}`,
            arguments: [content, sIndex, tIndex]
          })
        )
        result.unshift(codeLensAt(model, index.base + section.start, `Section ${sIndex + 1}`, {
          id: commandId,
          title: `Section ${sIndex + 1}`,
          arguments: [content, sIndex]
        }))
        return result
      }))
    },
    resolveCodeLens(model, codeLens, token) {
      return codeLens
    }
  })
}

module.exports = { defineLanguage, registerPlayCommand }