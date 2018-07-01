class TmLexer {
  constructor(rules, options) {
    this.rules = rules
    this.options = options
  }

  parse(source, options = {}) {
    const _options = this.options, tokens = []
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
            let token = rule.token.call(this, capture)
            if (token) {
              if (token instanceof Array) {
                token = { content: token }
              } else if (typeof token === 'string') {
                token = { text: token }
              }
              token.type = token.type || key
              tokens.push(token)
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
    return tokens
  }
}

module.exports = TmLexer