function edit(regex, opt) {
  regex = regex.source || regex
  opt = opt || ''
  return {
    replace(name, val) {
      regex = regex.replace(name, (val.source || val).replace(/(^|[^\[])\^/g, '$1'))
      return this
    },
    getRegex() {
      return new RegExp(regex, opt)
    }
  }
}

const originIndependentUrl = /^$|^[a-z][a-z0-9+.-]*:|^[?#]/i

const baseUrls = {}

function resolveUrl(base, href) {
  if (!baseUrls[' ' + base]) {
    // we can ignore everything in base after the last slash of its path component,
    // but we might need to add _that_
    // https://tools.ietf.org/html/rfc3986#section-3
    if (/^[^:]+:\/*[^/]*$/.test(base)) {
      baseUrls[' ' + base] = base + '/'
    } else {
      baseUrls[' ' + base] = base.replace(/[^/]*$/, '')
    }
  }
  base = baseUrls[' ' + base]

  if (href.slice(0, 2) === '//') {
    return base.replace(/:[\s\S]*/, ':') + href
  } else if (href.charAt(0) === '/') {
    return base.replace(/(:\/*[^/]*)[\s\S]*/, '$1') + href
  } else {
    return base + href
  }
}

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

function align(col) {
  return col.includes('<') ? 1 : col.includes('=') ? 2 : col.includes('>') ? 3 : 0
}

module.exports = {
  edit,
  resolveUrl,
  escape,
  unescape,
  align,
  originIndependentUrl
}