const { SubtrackParser } = require('./Track')
const { TmSetting, TmObject } = require('./Object')

const methodTypes = [
  'proGlobal',
  'proMerge',
  'epiNote',
  'epiTrack'
]

class TmLoader {
  /**
   * Tm Library Loader
   * @param {Tm.Syntax} Thulium Syntax Object
   */
  constructor(syntax) {
    this.Package = new TmPackage(syntax.Code, syntax.Dict)
    this.loadTypes(syntax.Types)
    this.loadChord(syntax.Chord)
    this.loadPlugin(syntax.Class)
    this.loadMeta(syntax.Meta)
    this.Track = {}
  }

  loadMeta(meta) {
    const preserved = [], initial = {}
    for (const attr in meta) {
      if (meta[attr].preserve) preserved.push(attr)
      if (meta[attr].initial) {
        initial[attr] = meta[attr].initial
      }
    }
    this.Meta = {
      Preserved: preserved,
      Initial: initial
    }
  }

  loadTypes(types) {
    const result = {}
    for (const type in types) {
      result[type] = {
        preserve: types[type].preserve,
        class: types[type].class
      }
    }
    this.Types = result
  }

  loadChord(dict) {
    const result = {}
    dict.forEach(chord => {
      result[chord.Notation] = chord.Pitches
    })
    this.Chord = result
  }

  loadPlugin(plugins) {
    this.Notation = function() {
      const result = {}
      for (const plugin of plugins) {
        result[plugin.Name] = []
      }
      return result
    }
    methodTypes.forEach(method => {
      const candidates = []
      plugins.forEach(plugin => {
        if (method in plugin) {
          candidates.push(plugin[method])
        }
      })
      this[method] = function(thisArg, ...rest) {
        candidates.forEach(func => func.call(thisArg, ...rest))
      }
    })
  }
}

class TmPackage {
  constructor(source, dict) {
    /* eslint-disable-next-line no-new-func */
    this.Dict = new Function(`${source}
      return {${dict.map(func => func.Name).join(',')}};
    `)()
  }

  applyFunction(parser, token) {
    const API = new TmAPI(parser, token, this.Dict)
    return this.Dict[token.Name].apply(API, TmPackage.getArguments(token.Args))
  }

  static getArguments(args) {
    return args.map(arg => {
      switch (arg.Type) {
      case 'Number':
      case 'String':
      case 'Array':
        return arg.Content
      case 'Expression':
        // FIXME: using expression parser
        /* eslint-disable-next-line no-eval */
        return eval(arg.Content.replace(/Log2/g, 'Math.log2'))
      default:
        return {
          Type: 'Subtrack',
          Content: [arg]
        }
      }
    })
  }
}

const Protocols = {
  Default: {
    Read: ['PitchQueue'],
    Write: ['PitchQueue']
  }
}

const NativeMethods = [
  'mergeMeta',
  'isLegalBar',
  'pushError'
]

class TmAPI {
  /**
   * Thulium API
   * @param {TmParser} Thulium Parser Object
   * @param {TmToken} Function Token
   * @param {TmPackageDict} Map of Functions
   */
  constructor(parser, token, dict) {
    Object.assign(this, parser)
    this.Token = token
    this.Function = new Proxy({}, {
      get: (_, name) => dict[name]
    })
    for (const method of NativeMethods) {
      this[method] = parser[method]
    }
  }

  newSettings(settings = {}) {
    return new TmSetting(settings)
  }

  ParsePlainTrack(track, { Protocol = 'Default', Settings = null } = {}) {
    const data = this.ParseTrack(track, { Protocol, Settings })
    const result = data[0]
    result.Meta.Duration = Math.max(...data.map(track => track.Meta.Duration))
    // FIXME: error handling
    result.Content.concat(...data.slice(1).map(track => track.Content))
    return result
  }

  ParseTrack(track, { Protocol = 'Default', Settings = null } = {}) {
    if (track === undefined) {
      track = { Type: 'Subtrack', Content: [] }
    }
    return new SubtrackParser(
      track,
      Settings === null ? this.Settings : this.Settings.extend(Settings),
      this.Library,
      TmAPI.wrap(this.Meta, Protocol)
    ).parse()
  }

  ReportError(name, args) {
    if (!name.includes('::')) {
      name = 'Func::' + this.Token.Name + '::' + name
    }
    this.pushError(name, args)
  }

  JoinTrack(src1, ...rest) {
    const result = {
      Meta: Object.assign(src1.Meta),
      Content: src1.Content.slice(),
      Warnings: src1.Warnings.slice(),
      Settings: this.Settings,
      pushError: this.pushError,
      isLegalBar: this.isLegalBar
    }
    for (let src of rest) {
      result.Content.push(...src.Content.map(note => {
        return Object.assign({}, note, {
          StartTime: note.StartTime + result.Meta.Duration
        })
      }))
      this.Meta.Duration += src.Meta.Duration
      this.mergeMeta(result, src)
    };
    return result
  }

  static wrap(meta, protocol) {
    const protocolList = Protocols[protocol]
    return new Proxy(meta, {
      get(obj, prop) {
        if (protocolList.Read.includes(prop)) {
          return obj[prop]
        }
        return null
      },
      set(obj, prop, val) {
        if (protocolList.Write.includes(prop)) {
          obj[prop] = val
        }
      }
    })
  }
}

module.exports = TmLoader
