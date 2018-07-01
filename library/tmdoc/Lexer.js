class TmLexer {
  constructor(rules, options) {
    this.rules = rules
    this.options = options
  }

  parse(source) {
    this.tokens = []
    while (source) {
      let capture, matched = false
      for (const rule of this.rules) {
        if (rule.exec === false) continue
        capture = rule.exec(source)
        if (capture) {
          source = source.substring(capture[0].length)
          if (rule.token) {
            const token = rule.token.call(this, capture)
            if (token) {
              if (rule.inner) {
                const length = this.tokens.length
                this.parse(rule.inner(capture))
                token.inner = this.tokens.splice(length, this.tokens.length - length)
              }
              token.type = rule.name
              this.tokens.push(token)
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
  }
}

module.exports = TmLexer