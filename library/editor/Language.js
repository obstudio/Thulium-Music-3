const yaml = require('js-yaml')
const fs = require('fs')

class TmLanguage {
  constructor(loadBuffer = false, saveBuffer = false) {
    if (loadBuffer) {
      this.source = require('./library/editor/tm.buffer.json')
    } else {
      this.source = yaml.safeLoad(fs.readFileSync(
        './library/editor/tm.yaml',
        { encoding: 'utf8' }
      ))
      if (saveBuffer) {
        fs.writeFileSync(
          './library/editor/tm.buffer.json',
          JSON.stringify(this.source),
          { encoding: 'utf8' }
        )
      }
    }
    this.variables = this.source.variables
    this.tokenizer = this.source.tokenizer
  }

  get definition() {
    const result = {}
    for (const ctx in this.tokenizer) {
      result[ctx] = this.tokenizer[ctx].map(item => this.transfer(item))
    }
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
    if (item.regex) {
      for (const name in this.variables) {
        item.regex = item.regex.replace('{{' + name + '}}', this.variables[name])
      }
      const match = item.regex.match(/^(\(\?[i]\))+/)
      if (match) {
        const modifier = item.regex[0].split('').filter(c => ['i'].includes(c)).join('')
        const remain = item.regex.slice(match[0].length)
        item.regex = new RegExp(remain, modifier)
      }
    }
    return item
  }
}
  
module.exports = new TmLanguage().definition
