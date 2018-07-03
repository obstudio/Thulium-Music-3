function copy(source) {
  if (source instanceof Array) {
    return source.map(copy)
  } else if (source instanceof Object) {
    const result = {}
    for (const key of source) {
      result[key] = copy(source[key])
    }
  } else {
    return source
  }
}

class TmLexer {
  constructor({rules, onToken, initial, capture}) {
    this.rules = rules.src
    this.onToken = onToken
    this.initial = initial
    this.capture = capture
  }

  provideGetters(capture) {
    if (!this.capture) return
    for (const key in this.capture) {
      Object.defineProperty(capture, key, {
        get: () => this.capture[key].call(this, capture)
      })
    }
  }

  test(test) {
    if (typeof test === 'boolean') {
      return test
    } else if (typeof test === 'string') {
      return this.options[test]
    } else if (test instanceof Function) {
      return test.call(this)
    } else {
      return true
    }
  }

  parse(source, options = {}) {
    let result = copy(this.initial)
    console.log(result)
    const _options = this.options
    Object.assign(this.options, options)
    while (source) {
      let matched = false
      for (const key in this.rules) {
        const rule = this.rules[key]
        if (!this.test(rule.test)) continue
        const capture = rule.regex.exec(source)
        if (capture) {
          source = source.substring(capture[0].length)
          if (rule.token) {
            let token
            if (typeof rule.token === 'string') {
              token = rule.token
            } else {
              this.provideGetters(capture)
              token = rule.token.call(this, capture)
            }
            if (token) result = this.onToken(result, token, key)
          }
          matched = true
          break
        }
      }
      if (matched) {
        continue
      } else if (source) {
        throw new Error('Infinite loop on byte: ' + source.charCodeAt(0))
      }
    }
    this.options = _options
    return result
  }
}

TmLexer.Rules = class LexerRules {
  /**
   * Generating lexing rules.
   * @param {Object} rules
   * @param {(String|Object)[]} [edits]
   * @param {String} edits[].key
   * @param {Function} edits[].edit
   */
  constructor(rules, edits = []) {
    this.src = rules
    edits.forEach((item) => {
      if (typeof item === 'string') {
        this.edit(item)
      } else {
        this.edit(item.key, item.edit)
      }
    })
  }

  /**
   * edit pattern
   * @param {String} key 
   * @param {Function} [callback]
   */
  edit(key, edit) {
    let source = this.src[key].regex.source
    for (const key in this.src) {
      source = source.replace(
        new RegExp(key, 'g'),
        this.src[key].regex.source.replace(/(^|[^\[])\^/g, '$1')
      )
    }
    if (edit) source = edit.call(this.src, source)
    this.src[key].regex = new RegExp(source, this.src[key].attrs || '')
  }
}

module.exports = TmLexer