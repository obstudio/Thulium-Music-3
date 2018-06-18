const instrDict = require('./config/Instrument.json')
const drumDict = require('./config/Percussion.json')
const Thulium = require('./Thulium')
const WafPlayer = require('./waf/player')

const defaultInstr = 'Piano'
const sampleRate = 44100
const numOfchannels = 1

window.fonts = window.fonts || {}

function audioLibFile(instr) {
  if (instr === '') {
    instr = defaultInstr
  }
  if (instr in instrDict) {
    return ('00' + instrDict[instr].toString()).slice(-3) + '0_FluidR3_GM_sf2_file.json'
  } else {
    return '128' + drumDict[instr].toString() + '_0_FluidR3_GM_sf2_file.json'
  }
}

function audioLibVar(instr) {
  if (instr === '') {
    instr = defaultInstr
  }
  if (instr in instrDict) {
    return '_tone_' + ('00' + instrDict[instr].toString()).slice(-3) + '0_FluidR3_GM_sf2_file'
  } else {
    return '_drum_' + drumDict[instr].toString() + '_0_FluidR3_GM_sf2_file'
  }
}

module.exports = {
  tracks: null,
  time: null,
  dueTime: null,
  ctx: null,
  player: null,

  // null - before initialization - to 1
  // 1 - initialized - to 1, 2, 5
  // 2 - loading - to 1, 3
  // 3 - playing - to 1, 4, 5
  // 4 - suspended - to 1, 3, 5
  // 5 - closed - to 1
  status: null,

  /**
   * @param source {string} tm source
   * @param [spec] {Array<{}|string>}
   * @param offline {boolean}
   */
  update(source, {spec, offline = false} = {}) {
    this.close()

    const result = new Thulium(source, {useFile: false}).adapt(spec, 'MIDI')
    this.tracks = result.tracks
    this.time = result.time
    this.dueTime = undefined
    this.ctx = offline ? new OfflineAudioContext(numOfchannels, sampleRate * numOfchannels * this.time, sampleRate) : new AudioContext()
    this.player = new WafPlayer()

    this.status = 1
    return this
  },

  play() {
    const instrNames = this.tracks.map((track) => track.Instrument)
    this.status = 2

    return Promise.all(instrNames.map((instr) => this.player.loader.load(this.ctx, audioLibFile(instr), audioLibVar(instr))))
      .then((instrs) => {
        this.status = 3
        const initialTime = this.ctx.currentTime
        this.dueTime = initialTime + this.time
        for (let i = 0, tracksLength = this.tracks.length; i < tracksLength; i++) {
          const content = this.tracks[i].Content
          for (let j = 0, contentLength = content.length; j < contentLength; j++) {
            this.player.queueWaveTable(
              this.ctx,
              this.ctx.destination,
              window.fonts[instrs[i]],
              content[j].StartTime + initialTime,
              ((content[j].Pitch === null) ? (drumDict[this.tracks[i].Instrument]) : (content[j].Pitch + 60)),
              content[j].Duration,
              content[j].Volume
            )
          }
        }
      })
  },

  suspend() {
    if (this.status === 3) {
      this.ctx.suspend()
      this.status = 4
    }
  },

  resume() {
    if (this.status === 4) {
      this.ctx.resume()
      this.status = 3
    }
  },

  close() {
    if (this.status !== 5 && this.status !== 2) {
      if (this.ctx instanceof AudioContext) this.ctx.close()
      this.status = 5
    }
  },

  toggle() {
    // if (this.dueTime < this.ctx.currentTime) {
    //   this.dueTime = undefined
    //   this.play()
    //   this.resume()
    //   return
    // }
    switch (this.status) {
      case 3:
        this.suspend()
        break
      case 4:
        this.resume()
        break
    }
  }
}
