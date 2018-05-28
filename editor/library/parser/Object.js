const effectTypes = [
  'FadeOut',
  'FadeIn',
  'Rev'
]

class TmObject {
  constructor(initObj) {
    Object.assign(this, initObj)
  }

  getOrSetDefault(key, defaultValue) {
    if (key in this && this[key] !== undefined) {
      return this[key]
    } else {
      this[key] = defaultValue
      return defaultValue
    }
  }

  static deepCopy(source) {
    if (source instanceof Array){
      return source.map(element => TmObject.deepCopy(element))
    } else if (typeof source === 'object') {
      const result = {}
      for (const key in source) {
        result[key] = TmObject.deepCopy(source[key])
      }
      return result
    } else {
      return source
    }
  }

  extend(settingObj = {}) {
    const settings = new this.constructor()
    for (const setting in this) {
      settings[setting] = TmObject.deepCopy(this[setting])
    }
    for (const setting in settingObj) {
      settings[setting] = TmObject.deepCopy(settingObj[setting])
    }
    return settings
  }
}

class TmMeta extends TmObject {
  constructor({
    Index = -1,
    PitchQueue = [],
    BarFirst = 0,
    BarLast = 0,
    BarCount = 0,
    Duration = 0,
    After = {}
  } = {}) {
    super({})
    this.Index = Index
    this.PitchQueue = PitchQueue
    this.BarFirst = BarFirst
    this.BarLast = BarLast
    this.BarCount = BarCount
    this.Duration = Duration
    this.After = After
  }
}

class TmSetting extends TmObject {
  constructor({
    Key = 0,
    Volume = 1,
    Bar = 4,
    Beat = 4,
    Speed = 60,
    Stac = [0, 1 / 2, 3 / 4],
    Accent = 2,
    Light = 1 / 2,
    Trace = 1,
    Duration = 0,
    FadeIn = 0,
    FadeOut = 0,
    Rev = 0
  } = {}) {
    super({})
    this.Key = Key
    this.Bar = Bar
    this.Beat = Beat
    this.Speed = Speed
    this.Volume = Volume
    this.Stac = Stac
    this.Accent = Accent
    this.Light = Light
    this.Trace = Trace
    this.Duration = Duration
    this.FadeIn = FadeIn
    this.FadeOut = FadeOut
    this.Rev = Rev
  }

  /**
   *
   * @param {tmSetting} tmSetting
   * @param {string} key
   * @param {number} value
   * @param {function} criterion
   */
  assignSetting(key, value, criterion) {
    if (this[key] instanceof Array) {
      if (value instanceof Array) {
        if (!value.every((v) => typeof value === 'number')) {
          throw new TypeError(`Non-numeric value passed in as ${key} element`)
        }
        if (!value.every((v) => criterion(v))) {
          throw new RangeError(`${key} out of range`)
        }
        this[key] = value
      } else {
        throw new TypeError(`Non-array value passed in as ${key}`)
      }
    } else {
      if (typeof value !== 'number') throw new TypeError(`Non-numeric value passed in as ${key}`)
      if (!criterion(value)) throw new RangeError(`${key} out of range`)
      this[key] = value
    }
  }

  assignSettingAtIndex(key, index, value, criterion) {
    if (this[key] instanceof Array) {
      if (typeof value !== 'number') throw new TypeError(`Non-numeric value passed in as ${key}`)
      if (typeof index !== 'number' || index < 0 || !Number.isInteger(index)) throw new TypeError(`Non-numeric index passed in as ${key} index`)
      if (!criterion(value)) throw new RangeError(`${key} out of range`)
      this[key][index] = value
    } else {
      throw new TypeError(`Non-array value passed in as ${key}`)
    }
  }

  get effects() {
    const result = {}
    effectTypes.forEach(key => {
      result[key] = TmObject.deepCopy(this[key])
    })
    return result
  }
}

module.exports = { TmSetting, TmMeta }

