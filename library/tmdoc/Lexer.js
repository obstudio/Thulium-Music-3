const defaults = require('./defaults')
const {edit, align} = require('./util')
const InlineLexer = require('./InlineLexer')

class Lexer {
  /**
   * Block Lexer
   */
  constructor(options) {
    this.tokens = []
    this.tokens.links = {}
    this.options = options || defaults
    this.rules = block
  }

  /**
   * Preprocessing
   */
  lex(src) {
    src = src
      .replace(/\r\n|\r/g, '\n')
      // .replace(/\t/g, '    ')
      .replace(/\u00a0/g, ' ')
      .replace(/\u2424/g, '\n')

    this.token(src, true)
    this.inline()
    return this.tokens
  }

  /**
   * Lexing
   */
  token(src, top) {
    src = src.replace(/^ +$/gm, '')
    let next,
      loose,
      cap,
      bull,
      b,
      item,
      space,
      i,
      tag,
      l,
      isordered

    while (src) {
      // newline
      if (cap = this.rules.newline.exec(src)) {
        src = src.substring(cap[0].length)
        // if (cap[0].length > 1) {
        //   this.tokens.push({
        //     type: 'space'
        //   })
        // }
      }

      // fences (gfm)
      if (cap = this.rules.fences.exec(src)) {
        src = src.substring(cap[0].length)
        this.tokens.push({
          type: 'Code',
          lang: cap[2] || this.options.defaultLanguage,
          code: cap[3] || ''
        })
        continue
      }

      // heading
      if (cap = this.rules.heading.exec(src)) {
        src = src.substring(cap[0].length)
        this.tokens.push({
          type: 'Heading',
          level: cap[1].length,
          text: cap[2]
        })
        continue
      }

      if (cap = this.rules.section.exec(src)) {
        src = src.substring(cap[0].length)
        this.tokens.push({
          type: 'Section',
          level: cap[1].length,
          text: cap[2]
        })
        continue
      }

      // hr
      if (cap = this.rules.hr.exec(src)) {
        src = src.substring(cap[0].length)
        this.tokens.push({
          type: 'Split',
          double: cap[1] === '=',
          style: cap[2].length === 1 ? 0 : cap[2][0] === ' ' ? 1 : 2
        })
        continue
      }

      // blockquote
      if (cap = this.rules.blockquote.exec(src)) {
        src = src.substring(cap[0].length)
        const length = this.tokens.length
        cap = cap[0].replace(/^ *[>?] ?/gm, '')

        // Pass `top` to keep the current
        // "toplevel" state. This is exactly
        // how markdown.pl works.
        this.token(cap, top)
        this.tokens.push({
          type: 'Blockquote',
          content: this.tokens.splice(length, this.tokens.length - length)
        })
        continue
      }

      // list
      if (cap = this.rules.list.exec(src)) {
        src = src.substring(cap[0].length)
        bull = cap[2]
        isordered = bull.length > 1

        // Get each top-level item.
        cap = cap[0].match(this.rules.item)

        next = false
        l = cap.length
        i = 0
        const items = []
        for (; i < l; i++) {
          item = cap[i]

          // Remove the list item's bullet
          // so it is seen as the next token.
          space = item.length
          item = item.replace(/^ *([*+-]|\d+\.) +/, '')

          // Outdent whatever the
          // list item contains. Hacky.
          if (~item.indexOf('\n ')) {
            space -= item.length
            item = item.replace(new RegExp(`^ {1,${space}}`, 'gm'), '')
          }

          // Determine whether the next list item belongs here.
          // Backpedal if it does not belong in this list.
          if (this.options.smartLists && i !== l - 1) {
            b = block.bullet.exec(cap[i + 1])[0]
            if (bull !== b && !(bull.length > 1 && b.length > 1)) {
              src = cap.slice(i + 1).join('\n') + src
              i = l - 1
            }
          }

          // Determine whether item is loose or not.
          // Use: /(^|\n)(?! )[^\n]+\n\n(?!\s*$)/
          // for discount behavior.
          loose = next || /\n\n(?!\s*$)/.test(item)
          if (i !== l - 1) {
            next = item.charAt(item.length - 1) === '\n'
            if (!loose) loose = next
          }

          const length = this.tokens.length
          // Recurse.
          this.token(item, false)
          items.push({
            type: 'item',
            loose,
            content: this.tokens.splice(length, this.tokens.length - length)
          })
        }
        this.tokens.push({
          type: 'List',
          inline: false,
          ordered: isordered,
          start: isordered ? +bull : '',
          content: items
        })
        continue
      }

      // inlinelist
      if (cap = this.rules.inlinelist.exec(src)) {
        src = src.substring(cap[0].length)
        const all = cap[0].trim().replace(/\n/g, '').slice(1)
        const r = /((?:[^\\+]|\\.)+)(?:\+|$)/g
        let match
        const items = []
        while ((match = r.exec(all)) !== null) items.push(match[1])
        this.tokens.push({
          type: 'list',
          inline: true,
          content: items
        })
        continue
      }

      // def
      if (top && (cap = this.rules.def.exec(src))) {
        src = src.substring(cap[0].length)
        if (cap[3]) cap[3] = cap[3].substring(1, cap[3].length - 1)
        tag = cap[1].toLowerCase().replace(/\s+/g, ' ')
        if (!this.tokens.links[tag]) {
          this.tokens.links[tag] = {
            href: cap[2],
            title: cap[3]
          }
        }
        continue
      }

      // table (gfm)
      if (top && (cap = this.rules.table.exec(src))) {
        src = src.substring(cap[0].length)
        const item = {
          type: 'Table',
          content: []
        }
        const headers = cap[1]
          .split(/\t+/)
          .map((col) => ({
            em: col.includes('*'),
            al: align(col)
          }))
        const cells = cap[2].split('\n').map((line) => line.split(/\t+/))
        for (const row of cells) {
          const rowRes = []
          let em = false
          if (row[0].startsWith('*')) {
            em = true
            row[0] = row[0].slice(1)
          }
          for (i = 0; i < row.length; ++i) {
            const cell = row[i], header = headers[i]
            rowRes.push({
              em: header.em || em,
              al: align(cell[0]) || header.al,
              text: cell.replace(/^[=<>]/, '')
            })
          }
          item.content.push(rowRes)
        }
        this.tokens.push(item)
        continue
      }

      // top-level paragraph
      if (top && (cap = this.rules.paragraph.exec(src))) {
        src = src.substring(cap[0].length)
        this.tokens.push({
          type: 'Paragraph',
          text: cap[1].charAt(cap[1].length - 1) === '\n'
            ? cap[1].slice(0, -1)
            : cap[1]
        })
        continue
      }

      // text
      if (cap = this.rules.text.exec(src)) {
        // Top-level should never reach here.
        src = src.substring(cap[0].length)
        this.tokens.push({
          type: 'Textblock',
          text: cap[0]
        })
        continue
      }

      if (src) {
        throw new Error('Infinite loop on byte: ' + src.charCodeAt(0))
      }
    }

    return this.tokens
  }

  inline() {
    const inl = new InlineLexer(this.tokens.links)

    function walk(node) {
      if (node.text) {
        node.text = inl.output(node.text)
      } else if (node.content) {
        if (typeof node.content[0] === 'string') {
          for (let i = 0; i < node.content.length; ++i) {
            node.content[i] = inl.output(node.content[i])
          }
        } else {
          for (const token of node.content) {
            if (token instanceof Array) {
              for (const t2 of token) {
                walk(t2)
              }
            } else {
              walk(token)
            }
          }
        }
      }
    }

    for (const token of this.tokens) {
      walk(token)
    }
  }
}

const block = {
  newline: /^\n+/,
  // code: /^( {4}[^\n]+\n*)+/,
  fences: /^ *(`{3,})[ .]*(\S+)? *\n([\s\S]*?)\n? *\1 *(?:\n+|$)/,
  hr: /^ {0,3}([-=])(\1|\.\1| \1)\2+ *(?:\n+|$)/,
  section: /^ *(\^{1,6}) *([^\n]+?) *(?:\^+ *)?(?:\n+|$)/,
  heading: /^ *(#{1,6}) +([^\n]+?) *(#*) *(?:\n+|$)/,
  // nptable: /^ *([^|\n ].*\|.*)\n *([-:]+ *\|[-| :]*)(?:\n((?:.*[^>\n ].*(?:\n|$))*)\n*|$)/,
  blockquote: /^( {0,3}[>?] ?(paragraph|[^\n]*)(?:\n|$))+/,
  list: /^( *)(bull) [\s\S]+?(?:hr|def|\n{2,}(?! )(?!\1bull )\n*|\s*$)/,
  inlinelist: /^(?: *\+[^\n]*[^+\n]\n(?= *\+))*(?: *\+[^\n]+\+?(?:\n+|$))/,
  def: /^ {0,3}\[((?!\s*])(?:\\[\[\]]|[^\[\]])+)]: *\n? *<?([^\s>]+)>?(?:(?: +\n? *| *\n *)((?:"(?:\\"?|[^"\\])*"|'[^'\n]*(?:\n[^'\n]+)*\n?'|\([^()]*\))))? *(?:\n+|$)/,
  // table: /^ *\|(.+)\n *\|?( *[-:]+[-| :]*)(?:\n((?: *[^>\n ].*(?:\n|$))*)\n*|$)/,
  table: /^([=<>*\t]+)\n((?:.+\n)*.*)(?:\n{2,}|$)/,
  paragraph: /^([^\n]+(?:\n(?!hr|heading| {0,3}>)[^\n]+)*)/,
  text: /^[^\n]+/
}

block.bullet = /(?:-|\d+\.)/
block.item = /^( *)(bull) [^\n]*(?:\n(?!\1bull )[^\n]*)*/
block.item = edit(block.item, 'gm')
  .replace(/bull/g, block.bullet)
  .getRegex()
block.list = edit(block.list)
  .replace(/bull/g, block.bullet)
  .replace('hr', '\\n+(?=\\1?(?:(?:- *){3,}|(?:_ *){3,}|(?:\\* *){3,})(?:\\n+|$))')
  .replace('def', `\\n+(?=${block.def.source})`)
  .getRegex()

block.paragraph = edit(block.paragraph)
  .replace('hr', block.hr)
  .replace('heading', block.heading)
  .getRegex()

block.blockquote = edit(block.blockquote)
  .replace('paragraph', block.paragraph)
  .getRegex()

block.paragraph = edit(block.paragraph)
  .replace('(?!', '(?!' +
    block.fences.source.replace('\\1', '\\2') + '|' +
    block.list.source.replace('\\1', '\\3') + '|')
  .getRegex()

Lexer.rules = block

module.exports = Lexer
