function escape(html, encode) {
  return html
    .replace(!encode ? /&(?!#?\w+;)/g : /&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function unescape(html) {
  // explicitly match decimal, hex, and named HTML entities
  return html.replace(/&(#(?:\d+)|(?:#x[0-9A-Fa-f]+)|(?:\w+));?/ig, function (_, n) {
    n = n.toLowerCase()
    if (n === 'colon') return ':'
    if (n.charAt(0) === '#') {
      return n.charAt(1) === 'x'
        ? String.fromCharCode(parseInt(n.substring(2), 16))
        : String.fromCharCode(+n.substring(1))
    }
    return ''
  })
}

class InlineLexer {
  /**
   * Inline Lexer & Compiler
   */
  constructor(options) {
    this.options = options
    this.rules = InlineLexer.rules
  }

  /**
   * Lexing / Compiling
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

      // link
      if (cap = this.rules.link.exec(src)) {
        src = src.substring(cap[0].length)
        let text, match

        if (cap[1]) {
          text = cap[1]
        } else if (match = cap[2].match(/^\$\w+(#\w+)$/)) {
          text = match[1]
        } else if (this.resolve(cap[2]) in this.options.dictionary) {
          text = this.options.dictionary[this.resolve(cap[2])]
        } else if (cap[2].includes('#') || cap[2].includes('/')) {
          text = cap[2].match(/[#/]([^#/]+)$/)[1]
        } else {
          text = cap[2]
        }
        if (cap[2][0] === '!') {
          out += `<img src="${cap[2].slice(1)}" alt="${text}" title="${text}">`
        } else {
          out += `<a href="#" data-raw-url="${cap[2]}" onclick="event.preventDefault()"'>${text}</a>`
        }
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

  resolve(url) {
    const parts = this.options.directory.split('/')
    const back = /^(\.\.\/)*/.exec(url)[0].length
    return parts.slice(0, -1 - back / 3).join('/') + '/' + url.slice(back)
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
}

InlineLexer.rules = {
  escape: /^\\([!"#$%&'()*+,\-./:;<=>?@\[\]\\^_`{|}~])/,
  link: /^\[(?:([^\]|]+)\|)?([^\]]+)\]/,
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
