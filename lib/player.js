import { audioLibDir, defaultInstr } from './config'
import instrDict from './Config/Instrument.json'
import drumDict from './Config/Percussion.json'
import Tokenizer from './token/Tokenizer'
import WafPlayer from './waf/player'
import Parser from './parser/Parser'
import MIDIAdapter from './MIDIAdapter'
const { library, load } = require('./AsyncProvider')
window.fonts = window.fonts || {}

function audioLibFile(instr) {
  if (instr === '') {
    instr = defaultInstr
  }
  if (instr in instrDict) {
    return audioLibDir + ('00' + instrDict[instr].toString()).slice(-3) + '0_FluidR3_GM_sf2_file.json'
  } else {
    return audioLibDir + '128' + drumDict[instr].toString() + '_0_FluidR3_GM_sf2_file.json'
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

export default class Player {
  constructor(value) {
    // this.value = value
    const result = typeof value === 'string'
      ? new MIDIAdapter().adapt(new Parser(new Tokenizer(value, load, library).tokenize()).parse())
      : new MIDIAdapter().adapt(new Parser(value).parse())
    this.tracks = result.tracks
    this.time = result.time
    this.dueTime = undefined
    this.ctx = new AudioContext()
    this.player = new WafPlayer()
  }

  play() {
    const instrNames = this.tracks.map((track) => track.Instrument)
    Promise.all(instrNames.map((instr) => this.player.loader.load(this.ctx, audioLibFile(instr), audioLibVar(instr)))).then(
      (instrs) => {
        const initialTime = this.ctx.currentTime
        this.dueTime = initialTime + this.time
        for (var i = 0, tracksLength = this.tracks.length; i < tracksLength; i++) {
          const content = this.tracks[i].Content
          for (var j = 0, contentLength = content.length; j < contentLength; j++) {
            if (content[j].Type === 'Note') {
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
        }
      }
    )
  }

  suspend() {
    if (this.ctx.state !== 'running') {
      return
    }
    this.ctx.suspend()
  }

  resume() {
    if (this.ctx.state !== 'suspended') {
      return
    }
    this.ctx.resume()
  }

  close() {
    if (this.ctx.state === 'closed') {
      return
    }
    this.ctx.close()
  }

  toggle() {
    if (this.dueTime < this.ctx.currentTime) {
      this.dueTime = undefined
      this.play()
      this.resume()
      return
    }
    switch (this.ctx.state) {
    case 'running':
      this.suspend()
      break
    case 'suspended':
      this.resume()
      break
    }
  }
}
