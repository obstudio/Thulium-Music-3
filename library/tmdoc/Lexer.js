class TmLexer {
  constructor({rules, onToken, initial, capture}) {
    this.rules = rules.src
    this.onToken = onToken
    this.initial = initial
    this.capture = capture
  }

  pack(capture) {
    if (!this.capture) return
    for (const key in this.capture) {
      Object.defineProperty(capture, key, {
        get: () => this.capture[key](capture)
      })
    }
  }

  parse(source, options = {}) {
    let result = this.initial
    const _options = this.options
    Object.assign(this.options, options)
    while (source) {
      let matched = false
      for (const key in this.rules) {
        const rule = this.rules[key]
        if (rule.test && !rule.test.call(this)) continue
        const capture = rule.regex.exec(source)
        if (capture) {
          source = source.substring(capture[0].length)
          if (rule.token) {
            this.pack(capture)
            let token = rule.token.call(this, capture)
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