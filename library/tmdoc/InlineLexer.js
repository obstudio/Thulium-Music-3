const defaults = require('./defaults')
const {escape, originIndependentUrl, resolveUrl, unescape} = require('./util')

class InlineLexer {
  /**
   * Inline Lexer & Compiler
   */
  constructor(links, options) {
    this.options = options || defaults
    this.links = links
    this.rules = InlineLexer.rules
  }

  /**
   * Lexing/Compiling
   */
  output(src) {
    let out = '', cap

    while (src) {
      // escape
      if (cap = this.rules.escape.exec(src)) {
        src = src.substring(cap[0].length)
        out += cap[1]
        continue
      }

      // tmlink
      if (cap = this.rules.tmlink.exec(src)) {
        src = src.substring(cap[0].length)
        let text, match
        if (cap[1]) {
          text = cap[1]
        } else if (match = cap[2].match(/^\$\w+(#\w+)$/)) {
          text = match[1]
        } else if (cap[2].includes('#')) {
          text = cap[2].match(/#([^#]+)$/)[1]
        } else if (cap[2].includes('/')) {
          text = cap[2].match(/\/([^/]+)$/)[1]
        } else {
          text = cap[2]
        }
        out += `<a href="#" data-raw-url="${cap[2]}" onclick="event.preventDefault()"'>${text}</a>`
        continue
      }

      // strong
      if (cap = this.rules.strong.exec(src)) {
        src = src.substring(cap[0].length)
        out += `<strong>${this.output(cap[2] || cap[1])}</strong>`
        continue
      }

      // underline
      if (cap = this.rules.underline.exec(src)) {
        src = src.substring(cap[0].length)
        out += `<u>${this.output(cap[2] || cap[1])}</u>`
        continue
      }

      // comment
      if (cap = this.rules.comment.exec(src)) {
        src = src.substring(cap[0].length)
        out += `<span class="comment">${this.output(cap[2] || cap[1])}</span>`
        continue
      }

      // package
      if (cap = this.rules.package.exec(src)) {
        src = src.substring(cap[0].length)
        out += `<code class="package">${this.output(cap[2] || cap[1])}</code>`
        continue
      }

      // em
      if (cap = this.rules.em.exec(src)) {
        src = src.substring(cap[0].length)
        out += `<em>${this.output(cap[3] || cap[2] || cap[1])}</em>`
        continue
      }

      // code
      if (cap = this.rules.code.exec(src)) {
        src = src.substring(cap[0].length)
        out += `<code>${escape(cap[2].trim(), true)}</code>`
        continue
      }

      // br
      if (cap = this.rules.br.exec(src)) {
        src = src.substring(cap[0].length)
        out += '<br>'
        continue
      }

      // del (gfm)
      if (cap = this.rules.del.exec(src)) {
        src = src.substring(cap[0].length)
        out += `<del>${this.output(cap[1])}</del>`
        continue
      }

      // text
      if (cap = this.rules.text.exec(src)) {
        src = src.substring(cap[0].length)
        out += escape(this.smartypants(cap[0]))
        continue
      }

      if (src) {
        throw new Error('Infinite loop on byte: ' + src.charCodeAt(0))
      }
    }

    return out
  }

  image(href, title, text) {
    if (this.options.baseUrl && !originIndependentUrl.test(href)) {
      href = resolveUrl(this.options.baseUrl, href)
    }
    return `<img src="${href}" alt="${text}" title="${title}">`
  }

  /**
   * Smartypants Transformations
   */
  smartypants(text) {
    if (!this.options.smartypants) return text
    return text
    // em-dashes
      .replace(/---/g, '\u2014')
      // en-dashes
      .replace(/--/g, '\u2013')
      // opening singles
      .replace(/(^|[-\u2014/(\[{"\s])'/g, '$1\u2018')
      // closing singles & apostrophes
      .replace(/'/g, '\u2019')
      // opening doubles
      .replace(/(^|[-\u2014/(\[{\u2018\s])"/g, '$1\u201c')
      // closing doubles
      .replace(/"/g, '\u201d')
      // ellipses
      .replace(/\.{3}/g, '\u2026')
  }

  static escapes(text) {
    return text ? text.replace(InlineLexer.rules._escapes, '$1') : text
  }
}

InlineLexer.rules = {
  _escapes: /\\([!"#$%&'()*+,\-./:;<=>?@\[\]\\^_`{|}~])/g,
  escape: /^\\([!"#$%&'()*+,\-./:;<=>?@\[\]\\^_`{|}~])/,
  tmlink: /^\[(?:([^\]|]+)\|)?([^\]]+)\]/,
  strong: /^\*\*([^\s][\s\S]*?[^\s])\*\*(?!\*)|^\*\*([^\s])\*\*(?!\*)/,
  em: /^\*([^\s][\s\S]*?[^\s*])\*(?!\*)|^\*([^\s*][\s\S]*?[^\s])\*(?!\*)|^\*([^\s*])\*(?!\*)/,
  underline: /^_([^\s][\s\S]*?[^\s_])_(?!_)|^_([^\s*])_(?!_)/,
  comment: /^\(\(([^\s][\s\S]*?[^\s])\)\)(?!\))|^\(\(([^\s])\)\)(?!\))/,
  package: /^\{\{([^\s][\s\S]*?[^\s])\}\}(?!\})|^\{\{([^\s])\}\}(?!\})/,
  code: /^(`+)\s*([\s\S]*?[^`]?)\s*\1(?!`)/,
  br: /^\n(?!\s*$)/,
  del: /^-(?=\S)([\s\S]*?\S)-/,
  text: /^[\s\S]+?(?=[\\<!\[`*({]|\b_|\n|$)/
}

module.exports = InlineLexer
