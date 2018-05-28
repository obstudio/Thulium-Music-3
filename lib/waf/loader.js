export class Loader {
  constructor(player) {
    this.player = player
    this.cached = []
  }

  async load(ctx, path, name) {
    if ((!(name in window.fonts)) && (this.cached.indexOf(name) === -1)) {
      this.cached.push(name)
      const response = await fetch(path, {
        mode: 'cors'
      })
      const json = await response.json()
      await this.player.adjustPreset(ctx, json)
      window.fonts[name] = json
    }
    return name
  }
}
