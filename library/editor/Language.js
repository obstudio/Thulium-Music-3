const yaml = require('js-yaml')
const fs = require('fs')
const path = require('path')

class TmLanguage {
  constructor(path, loadBuffer = false, saveBuffer = false) {
    if (loadBuffer) {
      this.source = require(path + '/syntax.buffer.json')
    } else {
      this.source = yaml.safeLoad(fs.readFileSync(path + '/syntax.yaml', { encoding: 'utf8' }))
      if (saveBuffer) {
        fs.writeFileSync(path + '/syntax.buffer.json', JSON.stringify(this.source), { encoding: 'utf8' })
      }
    }
  }

  definition() {
    const result = {}
    for (const ctx in this.source.tokenizer) {
      result[ctx] = this.source.tokenizer[ctx].map(item => this.transfer(item))
    }
    result.notation = []
    result.alias = []
    this.source.packages.forEach(name => {
      Object.assign(result, new TmExtension(name).definition())
      result.notation.push({ include: 'notation.' + name })
      result.alias.push({ include: 'alias.' + name })
    })
    return {
      tokenizer: result,
      tokenPostfix: '.' + this.source.postfix,
      defaultToken: this.source.default
    }
  }

  transfer(item) {
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
          action: {
            token: item[1],
            nextEmbedded: item[3]
          }
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
    if (item.regex) item.regex = this.toRegExp(item.regex)
    return item
  }

  toRegExp(string) {
    for (const name in this.source.variables) {
      string = string.replace(new RegExp(`{{${name}}}`, 'g'), this.source.variables[name])
    }
    return new RegExp(string)
  }
}

class TmExtension extends TmLanguage {
  constructor(name) {
    super(path.resolve(__dirname, '../../packages', name), false, false)
    if (!this.source.alias) this.source.alias = {}
    if (!this.source.notation) this.source.notation = []
    if (!this.source.variables) this.source.variables = {}
    this.name = name
  }

  definition() {
    const prefix = 'alias.' + this.name
    const result = {}
    result[prefix] = []

    const transferNotation = item => {
      const prefix = 'notation.' + this.name + '.'
      if (item[2] && !item[2].startsWith('@')) {
        result[prefix + item[2]] = this.source[item[2]].map(transferNotation)
        item[2] = prefix + item[2]
      }
      return this.transfer(item)
    }

    result['notation.' + this.name] = this.source.notation.map(transferNotation)
    for (let index = 0; index < this.source.alias.length; index++) {
      const alias = this.source.alias[index]
      result[prefix].push({
        regex: this.toRegExp(alias[0]),
        action: {
          token: '@rematch',
          next: prefix + '.' + index
        }
      })
      result[prefix + '.' + index] = alias.slice(1).map(item => this.transfer(item))
      result[prefix + '.' + index].unshift(
        { regex: /\(/, action: { token: 'function.alias' } },
        { regex: /\)/, action: { token: 'function.alias', next: '@pop' } }
      )
    }
    return result
  }
}
module.exports = new TmLanguage(__dirname).definition()
