const Player = require('../player')
const Thulium = require('../Thulium')

function getLanguageDefination(source) {
  const syntax = require(source)
  const result = {}
  for (const context in syntax.tokenizer) {
    result[context] = syntax.tokenizer[context].map(item => {
      if (item instanceof Array) {
        if (item[1] instanceof Object) {
          for (const cond in item[1]) {
            if (item[1][cond] instanceof Array) {
              item[1][cond] = {
                token: item[1][cond][0],
                next: item[1][cond][1]
              }
            }
          }
          item = {
            regex: item[0],
            action: { cases: item[1] }
          }
        } else {
          const opration = item[2]
          item = {
            regex: item[0],
            action: { token: item[1] }
          }
          if (opration instanceof Array) {
            item.action.switchTo = opration[0]
          } else if (opration) {
            item.action.next = opration
          }
        }
      } else if (!(item instanceof Object)) {
        item = { include: item }
      }
      if (item.regex) {
        for (const name in syntax.variables) {
          item.regex = item.regex.replace('{{' + name + '}}', syntax.variables[name])
        }
        const match = item.regex.match(/^(\(\?[i]\))+/)
        if (match) {
          const modifier = item.regex[0].split('').filter(c => ['i'].includes(c)).join('')
          const remain = item.regex.slice(match[0].length)
          item.regex = new RegExp(remain, modifier)
        }
      }
      return item
    })
  }
  return {
    tokenizer: result,
    tokenPostfix: syntax.postfix,
    defaultToken: syntax.default
  }
}

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
  window.monaco.languages.setMonarchTokensProvider('tm', getLanguageDefination('./tm'))
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
          codeLensAt(model, index.base + track, `Section ${sIndex + 1} Track ${tIndex + 1}`, {
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