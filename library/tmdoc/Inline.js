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

const rules = new TmLexer.Rules([
  {
    name: 'escape',
    regex: /^\\([!"#$%&'()*+,\-./:;<=>?@\[\]\\^_`{|}~])/,
    token: (cap) => cap[1]
  },
  {
    name: 'link',
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
  {
    name: 'strong',
    regex: /^\*\*([^\s][\s\S]*?[^\s])\*\*(?!\*)|^\*\*([^\s])\*\*(?!\*)/,
    token: (cap) => `<strong>${cap.match}</strong>`,
    getter: true
  },
  {
    name: 'underline',
    regex: /^_([^\s][\s\S]*?[^\s_])_(?!_)|^_([^\s*])_(?!_)/,
    token: (cap) => `<u>${cap.match}</u>`,
    getter: true
  },
  {
    name: 'comment',
    regex: /^\(\(([^\s][\s\S]*?[^\s])\)\)(?!\))|^\(\(([^\s])\)\)(?!\))/,
    token: (cap) => `<span class="comment">${cap.match}</span>`,
    getter: true
  },
  {
    name: 'package',
    regex: /^\{\{([^\s][\s\S]*?[^\s])\}\}(?!\})|^\{\{([^\s])\}\}(?!\})/,
    token: (cap) => `<code class="package">${cap.match}</code>`,
    getter: true
  },
  {
    name: 'em',
    regex: /^\*([^\s][\s\S]*?[^\s*])\*(?!\*)|^\*([^\s*][\s\S]*?[^\s])\*(?!\*)|^\*([^\s*])\*(?!\*)/,
    token: (cap) => `<em>${cap.match}</em>`,
    getter: true
  },
  {
    name: 'code',
    regex: /^(`+)\s*([\s\S]*?[^`]?)\s*\1(?!`)/,
    token: (cap) => `<code>${escape(cap[2].trim(), true)}</code>`
  },
  {
    name: 'br',
    regex: /^\n(?!\s*$)/,
    token: '<br/>'
  },
  {
    name: 'del',
    regex: /^-(?=\S)([\s\S]*?\S)-/,
    token: (cap) => `<del>${cap.match}</del>`,
    getter: true
  },
  {
    name: 'text',
    regex: /^[\s\S]+?(?=[\\<!\[`*({]|\b_|\n|$)/,
    token: (cap) => escape(cap[0])
  }
])


class InlineLexer extends TmLexer {
  /**
   * Inline Lexer & Compiler
   */
  constructor(options) {
    super({
      rules,
      mode: 1,
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
