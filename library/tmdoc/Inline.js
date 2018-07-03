const TmLexer = require('./Lexer')

function escape(html, encode) {
  return html
    .replace(!encode ? /&(?!#?\w+;)/g : /&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function resolve(base, url) {
  const back = /^(\.\.\/)*/.exec(url)[0].length
  return base.split('/').slice(0, -1 - back / 3).join('/') + '/' + url.slice(back)
}

const rules = new TmLexer.Rules({
  escape: {
    regex: /^\\([!"#$%&'()*+,\-./:;<=>?@\[\]\\^_`{|}~])/,
    token: (cap) => cap[1]
  },
  link: {
    regex: /^\[(?:([^\]|]+)\|)?([^\]]+)\]/,
    token(cap) {
      let text, match, index
      const dict = this.options.dictionary
      if (cap[1]) {
        text = cap[1]
      } else if (match = cap[2].match(/^\$\w+(#\w+)$/)) {
        text = match[1]
      } else if ((index = resolve(this.options.directory, cap[2])) in dict) {
        text = dict[index]
      } else if (cap[2].includes('#') || cap[2].includes('/')) {
        text = cap[2].match(/[#/]([^#/]+)$/)[1]
      } else {
        text = cap[2]
      }
      return `<a href="#" data-raw-url="${cap[2]}" onclick="event.preventDefault()"'>${text}</a>`
    }
  },
  strong: {
    regex: /^\*\*([^\s][\s\S]*?[^\s])\*\*(?!\*)|^\*\*([^\s])\*\*(?!\*)/,
    token(cap) {
      return `<strong>${cap.match}</strong>`
    }
  },
  underline: {
    regex: /^_([^\s][\s\S]*?[^\s_])_(?!_)|^_([^\s*])_(?!_)/,
    token(cap) {
      return `<u>${cap.match}</u>`
    }
  },
  comment: {
    regex: /^\(\(([^\s][\s\S]*?[^\s])\)\)(?!\))|^\(\(([^\s])\)\)(?!\))/,
    token(cap) {
      return `<span class="comment">${cap.match}</span>`
    }
  },
  package: {
    regex: /^\{\{([^\s][\s\S]*?[^\s])\}\}(?!\})|^\{\{([^\s])\}\}(?!\})/,
    token(cap) {
      return `<code class="package">${cap.match}</code>`
    }
  },
  em: {
    regex: /^\*([^\s][\s\S]*?[^\s*])\*(?!\*)|^\*([^\s*][\s\S]*?[^\s])\*(?!\*)|^\*([^\s*])\*(?!\*)/,
    token(cap) {
      return `<em>${cap.match}</em>`
    }
  },
  code: {
    regex: /^(`+)\s*([\s\S]*?[^`]?)\s*\1(?!`)/,
    token: (cap) => `<code>${escape(cap[2].trim(), true)}</code>`
  },
  br: {
    regex: /^\n(?!\s*$)/,
    token: '<br/>'
  },
  del: {
    regex: /^-(?=\S)([\s\S]*?\S)-/,
    token(cap) {
      return `<del>${cap.match}</del>`
    }
  },
  text: {
    regex: /^[\s\S]+?(?=[\\<!\[`*({]|\b_|\n|$)/,
    token: (cap) => escape(cap[0])
  }
})


class InlineLexer extends TmLexer {
  /**
   * Inline Lexer & Compiler
   */
  constructor(options) {
    super({
      rules,
      initial: () => '',
      onToken(prev, curr) {
        return prev + curr
      },
      getters: {
        match(capture) {
          let match = capture[0]
          capture.slice(1).forEach(item => {
            if (item) match = item
          })
          return this.parse(match)
        }
      }
    })
    this.options = options
  }
}

module.exports = InlineLexer
