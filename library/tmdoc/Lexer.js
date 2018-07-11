class TmLexer {
  /**
   * Lexer Constructor
   * @param {TmLexer.LexerRules} rules rules
   * @param {Number} mode mode
   * &nbsp; 0: array
   * &nbsp; 1: string
   * @param {Object} getters getters
   */
  constructor({rules, mode, getters}) {
    this.mode = mode
    this.rules = rules.data
    this.getters = getters
  }

  /**
   * Provide attribute for capture
   */
  provide(capture) {
    if (!this.getters) return
    for (const key in this.getters) {
      Object.defineProperty(capture, key, {
        get: () => this.getters[key].call(this, capture)
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

  token(rule, capture) {
    if (rule.token) {
      if (typeof rule.token === 'string') {
        return rule.token
      } else {
        if (rule.getter) this.provide(capture)
        return rule.token.call(this, capture)
      }
    }
  }

  parse(source, options = {}) {
    let result = this.mode === 1 ? '' : []
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
          let data = this.token(rule, capture)
          if (data) {
            if (this.mode === 1) {
              result += data
            } else {
              if (data instanceof Array) {
                data = { content: data }
              } else if (typeof data === 'string') {
                data = { text: data }
              }
              data.type = data.type || key
              result.push(data)
            }
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
   * @param {Object[]} rules
   * @param {RegExp} rules[].regex regular expression for the rule
   * @param {String} [rules[].attrs] options for regexp (default value is '')
   * @param {String|Function|Boolean} [rules[].test]
   * whether this rule should be executed in lexing
   *   Function: (TmLexer) => Boolean
   *   String: test for key in TmLexer.options
   * (default value is true)
   * @param {Boolean} [rules[].getter] provide getters for capture (default value is false)
   * @param {String|Function} rules[].token
   *   Function: (capture) => token
   *   String: token itself
   * 
   * @param {Object[]} [edits]
   * @param {String} edits[].key
   * @param {Function} edits[].edit
   */
  constructor(rules, edits = []) {
    this.data = {}
    rules.forEach((rule) => this.data[rule.name] = rule)
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
    let source = this.data[key].regex.source
    for (const key in this.data) {
      source = source.replace(
        new RegExp(key, 'g'),
        this.data[key].regex.source.replace(/(^|[^\[])\^/g, '$1')
      )
    }
    if (edit) source = edit.call(this.data, source)
    this.data[key].regex = new RegExp(source, this.data[key].attrs || '')
  }
}

module.exports = TmLexer