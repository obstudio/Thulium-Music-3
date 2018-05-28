const acorn = require('acorn')
const FSM = require('./Context')
const { AliasSyntax } = require('./Alias')

const int = '([+\\-]?\\d+)'
const item = `(\\[${int}?(:${int}?)?\\])?${int}?`
const exp = `(${item}(, *${item})*)`
const def = `([a-zA-Z])\\t+(?:([^\\t]+)\\t+)?`
const ChordItem = new RegExp(`${item}`)
const ChordPatt = new RegExp(`^${def}${exp}$`)

const funcTypes = [
  'FunctionExpression',
  'ArrowFunctionExpression',
  'FunctionDeclaration',
  'ClassDeclaration',
  'ClassExpression'
]

const methodTypes = [
  'proGlobal',
  'proMerge',
  'epiNote',
  'epiTrack'
]

class TmLibrary {
  /**
   * 判断函数是否无返回值
   * @param {ESTree.FunctionDeclaration} funcAST 函数声明节点
   * @returns {boolean} 当至少有一个支路上包含return语句时返回false，否则返回true
   * @throws 如果ast包含throw语句，isVoid将丢出一个错误
   */
  static isVoid(funcAST) {
    function walk(node) {
      if (node.type === 'ReturnStatement') {
        return !node.argument
      }
      if (funcTypes.includes(node.type)) {
        return true
      }
      if ('body' in node) {
        if (node.body instanceof Array) {
          return node.body.every(walk)
        } else {
          return walk(node.body)
        }
      }
      switch (node.type) {
      case 'IfStatement':
        return walk(node.consequent) && (!node.alternate || walk(node.alternate))
      case 'SwitchStatement':
        return node.cases.every((sub) => sub.consequent.every(walk))
      case 'ThrowStatement':
        throw new Error('With throw')
      case 'TryStatement':
        return walk(node.block) &&
              (!node.handler || walk(node.handler.body)) &&
              (!node.finalizer || walk(node.finalizer))
      default:
        return true
      }
    }
    return walk(funcAST.body)
  }

  static chordTokenize(lines) {
    const data = [], warnings = []
    lines.forEach(line => {
      const match = line.match(ChordPatt)
      if (match) {
        const notation = match[1]
        const comment = match[2]
        const pitches = match[3].split(/, */).map(item => {
          const data = item.match(ChordItem)
          return [
            data[2] ? parseInt(data[2]) : 0,
            data[4] ? parseInt(data[4])
              : data[3] ? -1
                : data[2] ? parseInt(data[2])
                  : data[1] ? -1 : 0,
            data[5] ? parseInt(data[5]) : 0
          ]
        })
        data.push({
          Notation: notation,
          Comment: comment,
          Pitches: pitches
        })
      } else {
        if (!line.match(/^\s*$/)) {
          warnings.push({
            Err: 'InvChordDecl',
            Data: line
          })
        }
      }
    })
    return {
      Chord: data,
      Errors: [],
      Warnings: warnings
    }
  }

  static functionTokenize(lines) {
    let code = lines.join('\n')
    const aliases = [], errors = [], warnings = []
    const dict = [], syntax = [], comments = []

    try {
      const result = acorn.parse(code, {
        ecmaVersion: 8,
        onComment(isBlock, text, start, end) {
          const result = AliasSyntax.Pattern.exec(text)
          comments.push({start, end})
          if (!isBlock && result) {
            const alias = new AliasSyntax(text)
            if (alias.analyze()) {
              syntax.push({start, end, alias})
            } else {
              warnings.push(...alias.Warnings)
            }
          }
        }
      })
      result.body.forEach(tok => {
        if (tok.type === 'FunctionDeclaration') {
          const name = tok.id.name
          const voidQ = TmLibrary.isVoid(tok)
          dict.push({ Name: name, VoidQ: voidQ })
          let order = 0
          for (let i = 0; i < syntax.length; i++) {
            if (tok.body.start < syntax[i].start && tok.body.end > syntax[i].end) {
              order += 1
              aliases.push(Object.assign(syntax[i].alias, {
                Name: name,
                Order: order,
                VoidQ: voidQ
              }))
            }
          }
        } else {
          errors.push({
            Err: 'NotFuncDecl',
            Type: tok.type,
            Start: tok.start,
            End: tok.end
          })
        }
      })
      for (let i = comments.length - 1; i >= 0; i--) {
        code = code.slice(0, comments[i].start) + code.slice(comments[i].end)
      }
    } catch (err) {
      errors.push({
        Err: 'SyntaxError',
        Info: err
      })
    }

    return {
      Alias: aliases,
      Dict: dict,
      Code: code,
      Errors: errors,
      Warnings: warnings
    }
  }

  static notationTokenize(lines) {
    const code = lines.join('\n')
    const errors = [], warnings = [], syntax = {}, proEpi = [], types = {}, meta = {}
    try {
      const result = acorn.parse(code, {ecmaVersion: 8})
      result.body.forEach(tok => {
        if (tok.type === 'ClassDeclaration') {
          const data = eval(`new(${code.slice(tok.start, tok.end)})()`)
          // FIXME: test for types
          data.Name = tok.id.name
          TmLibrary.loadContext(syntax, data.syntax)
          TmLibrary.loadTypes(types, data.attributes, data.Name)
          TmLibrary.loadMeta(meta, data.metaAttributes)
          delete data.syntax
          TmLibrary.loadClass(proEpi, [data])
        } else {
          errors.push({
            Err: 'NotClassDecl',
            Type: tok.type,
            Start: tok.start,
            End: tok.end
          })
        }
      })
    } catch (err) {
      throw err
      errors.push({
        Err: 'SyntaxError',
        Info: err
      })
    }

    return {
      Meta: meta,
      Types: types,
      Class: proEpi,
      Context: syntax,
      Errors: errors,
      Warnings: warnings
    }
  }

  static append(dest, src, tag) {
    for (const item of src) {
      const index = dest.findIndex(ori => ori[tag] === item[tag])
      if (index === -1) {
        dest.push(item)
      } else {
        dest.splice(index, 1, item)
      }
    }
  }

  static loadCode(dest, src) {
    return dest + src
  }

  static loadDict(dest, src) {
    TmLibrary.append(dest, src, 'Name')
  }

  static loadAlias(dest, src) {
    TmLibrary.append(dest, src, 'Source')
  }

  static loadChord(dest, src) {
    TmLibrary.append(dest, src, 'Notation')
  }

  static loadNotation(dest, src) {
    TmLibrary.append(dest, src, 'Name')
  }

  static loadClass(dest, src) {
    TmLibrary.append(dest, src, 'Name')
  }

  static loadTypes(dest, src, name = false) {
    for (const type in src) {
      dest[type] = src[type]
      if (name) dest[type].class = name
    }
  }

  static loadMeta(dest, src) {
    if (!src) src = {}
    Object.assign(dest, src)
  }

  static loadContext(dest, src) {
    for (const context in src) {
      if (context in dest) {
        dest[context].push(...src[context])
      } else {
        dest[context] = src[context]
      }
    }
  }
}

module.exports = TmLibrary

