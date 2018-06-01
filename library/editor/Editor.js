const Player = require('../player')
const Thulium = require('../Thulium')
const Language = require('./Language')
const instrument = [
  ...Object.keys(require('../config/instrument.json')),
  ...Object.keys(require('../config/percussion.json'))
]
const instDocs = require('../../language/zh-CN/instruments.json')

// See window.monaco.languages.CompletionItemKind
const instCompletions = instrument.map(inst => {
  return {
    label: inst,
    kind: 5, // Variable
    documentation: inst + '\n' + instDocs[inst],
    insertText: inst
  }
})
const packCompletions = Thulium.$library.Packages.map(pack => {
  return {
    label: pack,
    kind: 8, // Module
    documentation: pack,
    insertText: pack
  }
})
const cmdCompletions = ['include', 'notation', 'function', 'chord', 'end'].map(cmd => {
  return {
    label: cmd,
    kind: 13, // Keyword
    documentation: cmd,
    insertText: cmd
  }
})

let commandId = ''
function registerPlayCommand(editor) {
  commandId = editor.addCommand(window.monaco.KeyCode.NumLock, (_, result, Index, Tracks) => {
    if (Tracks === undefined) {
      new Player(result, Index).play()
    } else {
      new Player(result, { Index, Tracks }).play()
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

let $defined = false
function defineLanguage(scheme) {
  if ($defined) return
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
      const matches = model.findMatches('@[A-Za-z][A-Za-z0-9]*', false, true, false, '', true)
      const trueMatch = matches.find(match =>
        match.range.startLineNumber === position.lineNumber &&
        match.range.endLineNumber === position.lineNumber &&
        match.range.startColumn <= position.column &&
        match.range.endColumn >= position.column
      )
      if (!trueMatch) return
      const defs = model.findMatches(`<:${trueMatch.matches[0].slice(1)}:>`, false, false, true, '', false)
      const definition = defs[0] // FIXME: find last index before
      return {
        uri: model.uri,
        range: definition.range
      }
    }
  })

  window.monaco.languages.registerCompletionItemProvider('tm', {
    triggerCharacters: ['@', '#'],
    provideCompletionItems(model, position, token) {
      const offset = model.getOffsetAt(position)
      const content = model.getValue(1)
      const char = content.charAt(offset - 1)
      const line = model.getLineContent(position.lineNumber)
      const song = new Thulium(content, { useFile: false })
      console.log(line)
      if (song.matchScope('inst', offset)) {
        return instCompletions
      } else if (song.matchScope('pack', offset)) {
        return packCompletions
      } else if (line.match(/^# */) && position.column) {
        return cmdCompletions
      } else if (char === '@') {
        return song.Macro.map(macro => {
          return {
            label: macro.name,
            kind: 17, // Reference
            documentation: macro.code,
            insertText: macro.name
          }
        })
      }
    }
  })

  window.monaco.languages.registerCodeLensProvider('tm', {
    provideCodeLenses(model, token) {
      model.setEOL(0)
      const content = model.getValue(1)
      const song = new Thulium(content, { useFile: false })
      const index = song.Index
      return [].concat(...index.sections.map((section, sIndex) => {
        if (song.parse().every(sect => sect.Index !== sIndex)) return []
        const sectionIndex = song.parse().findIndex(sect => sect.Index === sIndex)
        const sectionData = song.parse()[sectionIndex].Tracks
        const result = [codeLensAt(model, index.base + section.start, `Section ${sIndex + 1}`, {
          id: commandId,
          title: `Section ${sIndex + 1}`,
          arguments: [ content, sectionIndex ]
        })]
        section.tracks.forEach((track, tIndex) => {
          if (sectionData.every(trac => trac.Index !== tIndex)) return
          const trackIndex = sectionData.findIndex(trac => trac.Index === tIndex)
          result.push(codeLensAt(model, index.base + track, `Section ${sIndex + 1} Track ${tIndex + 1}`, {
            id: commandId,
            title: `Track ${tIndex + 1}`,
            arguments: [ content, sectionIndex, [ trackIndex ] ]
          }))
        })
        return result
      }))
    },
    resolveCodeLens(model, codeLens, token) {
      return codeLens
    }
  })
  $defined = true
}

module.exports = { defineLanguage, registerPlayCommand }