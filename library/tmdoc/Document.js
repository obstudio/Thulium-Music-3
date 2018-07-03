const TmLexer = require('./Lexer')
const InlineLexer = require('./Inline')

function align(col) {
  return col.includes('<') ? 1 : col.includes('=') ? 2 : col.includes('>') ? 3 : 0
}

const rules = new TmLexer.Rules({
  newline: {
    regex: /^\n+/
  },
  code: {
    regex: /^ *(`{3,})[ .]*(\S+)? *\n([\s\S]*?)\n? *\1 *(?:\n+|$)/,
    token: (cap) => ({
      lang: cap[2] || 'tm',
      code: cap[3] || ''
    })
  },
  heading: {
    regex: /^ *(#{1,4}) +([^\n]+?) *(#*) *(?:\n+|$)/,
    token: (cap) => ({
      level: cap[1].length,
      text: cap[2]
    })
  },
  section: {
    regex: /^ *(\^{1,3}) *([^\n]+?) *(?:\^+ *)?(?:\n+|$)/,
    token: (cap) => ({
      level: cap[1].length,
      text: cap[2]
    })
  },
  separator: {
    regex: /^ {0,3}([-=])(\1|\.\1| \1)\2+ *(?:\n+|$)/,
    token: (cap) => ({
      double: cap[1] === '=',
      style: cap[2].length === 1 ? 0 : cap[2][0] === ' ' ? 1 : 2
    })
  },
  blockquote: {
    regex: /^( *>\w* (paragraph|[^\n]*)(?:\n|$))+/,
    token(cap) {
      return {
        mode: cap[0].match(/^ *>(\w*)/)[1],
        content: this.parse(cap[0].replace(/^ *>\w* +/gm, ''))
      }
    }
  },
  usage: {
    regex: /^( *\? +(paragraph|[^\n]*)(?:\n|$))+/,
    token(cap) {
      return cap[0].split(/^ *\? +/gm).slice(1).map((source) => {
        return this.parse(source)
      })
    }
  },
  bullet: {
    regex: /(?:-|\d+\.)/,
    test: false
  },
  item: {
    attrs: 'gm',
    regex: /^( *)(bullet) [^\n]*(?:\n(?!\1bullet )[^\n]*)*/,
    test: false
  },
  list: {
    regex: /^( *)(bullet) [\s\S]+?(?:\n+(?=separator|definition)|\n+(?! )(?!\1bullet )\n*|\s*$)/,
    token(cap) {
      return {
        ordered: cap[2].length > 1,
        content: cap[0].match(this.rules.item.regex).map((item) => {
          // Remove the list item's bullet so it is seen as the next token.
          let space = item.length
          item = item.replace(/^ *([*+-]|\d+\.) +/, '')
          // Outdent whatever the list item contains. Hacky.
          if (~item.indexOf('\n ')) {
            space -= item.length
            item = item.replace(new RegExp(`^ {1,${space}}`, 'gm'), '')
          }
          const d = this.parse(item, { topLevel: false })
          return d 
        })
      }
    }
  },
  inlinelist: {
    regex: /^(?: *\+[^\n]*[^+\n]\n(?= *\+))*(?: *\+[^\n]+\+?(?:\n+|$))/,
    token(cap) {
      const source = cap[0].trim().replace(/\n/g, '').slice(1)
      let match, inner = []
      while ((match = /((?:[^\\+]|\\.)+)(?:\+|$)/g.exec(source)) !== null) {
        inner.push(match[1])
      }
      return inner
    }
  },
  definition: {
    regex: /^ *\[\w+\]: *\n? *<?([^\s>]+)>?(?:(?: +\n? *| *\n *)((?:"(?:\\"?|[^"\\])*"|'[^'\n]*(?:\n[^'\n]+)*\n?'|\([^()]*\))))? *(?:\n+|$)/,
    test: 'topLevel',
    token(cap) {
      if (cap[3]) cap[3] = cap[3].substring(1, cap[3].length - 1)
      const tag = cap[1].toLowerCase().replace(/\s+/g, ' ')
      this.options.links[tag] = {
        href: cap[2],
        title: cap[3]
      }
    }
  },
  table: {
    regex: /^([=<>*\t]+)\n((?:.+\n)*.*)(?:\n{2,}|$)/,
    test: 'topLevel',
    token(cap) {
      const headers = cap[1].split(/\t+/).map((col) => ({
        em: col.includes('*'),
        al: align(col)
      }))
      return cap[2].split('\n').map((line) => {
        const row = line.split(/\t+/)
        let em = false
        if (row[0].startsWith('*')) {
          em = true
          row[0] = row[0].slice(1)
        }
        return row.map((cell, index) => {
          const col = headers[index]
          return {
            em: col.em || em,
            al: align(cell[0]) || col.al,
            text: cell.replace(/^[=<>]/, '')
          }
        })
      })
    }
  },
  paragraph: {
    regex: /^([^\n]+(?:\n(?!separator|heading| {0,3}>)[^\n]+)*)/,
    token: (cap) => cap[1].endsWith('\n') ? cap[1].slice(0, -1) : cap[1]
  },
  text: {
    regex: /^[^\n]+/,
    token: (cap) => cap[0]
  }
}, [
  'item',
  'list',
  'paragraph',
  'blockquote',
  'usage',
  {
    key: 'paragraph',
    edit(source) {
      return source.replace('(?!', '(?!'
        + this.code.regex.source.replace('\\1', '\\2') + '|'
        + this.list.regex.source.replace('\\1', '\\3') + '|')
    }
  }
])

class DocumentLexer extends TmLexer {
  /**
   * Block Lexer
   * @param {Object} dictionary link dictionary
   * @param {String} directory working directory
   */
  constructor({
    dictionary = {},
    directory = '/'
  } = {}) {
    super({
      rules,
      initial: [],
      onToken(prev, curr, type) {
        if (curr instanceof Array) {
          curr = { content: curr }
        } else if (typeof curr === 'string') {
          curr = { text: curr }
        }
        curr.type = curr.type || type
        prev.push(curr)
        return prev
      }
    })
    this.options = {
      dictionary,
      directory,
      links: {}
    }
  }

  lex(source) {
    source = source
      .replace(/\r\n|\r/g, '\n')
      .replace(/\u00a0/g, ' ')
      .replace(/\u2424/g, '\n')

    const tokens = this.parse(source, { topLevel: true })
    return this.inline(tokens)
  }

  inline(tokens) {
    const lexer = new InlineLexer(this.options)

    function walk(node) {
      if (node instanceof Array) {
        node.forEach(walk)
      } else if (node.text) {
        console.log(node.text)
        node.text = lexer.parse(node.text)
      } else if (node.content) {
        node.content.forEach(walk)
      }
    }

    tokens.forEach(walk)
    return tokens
  }
}

module.exports = DocumentLexer
