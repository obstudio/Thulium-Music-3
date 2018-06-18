const loadAudioFont = require('wafd-tm3')

class Loader {
  constructor(player) {
    this.player = player
    this.cached = []
  }

  async load(ctx, path, name) {
    if ((!(name in window.fonts)) && (this.cached.indexOf(name) === -1)) {
      this.cached.push(name)
      const json = loadAudioFont(path)
      await this.player.adjustPreset(ctx, json)
      window.fonts[name] = json
    }
    return name
  }
}

module.exports = Loader
