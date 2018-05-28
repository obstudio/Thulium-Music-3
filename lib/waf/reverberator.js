export class Reverberator {
  constructor(ctx, irrArrayBuffer) {
    this.ctx = ctx
    this.input = this.ctx.createBiquadFilter()
    this.input.type = 'lowpass'
    this.input.frequency.setTargetAtTime(18000, 0, 0.0001)
    this.convolver = null
    this.output = ctx.createGain()
    this.dry = ctx.createGain()
    this.dry.gain.setTargetAtTime(0.9, 0, 0.0001)
    this.dry.connect(this.output)
    this.wet = ctx.createGain()
    this.wet.gain.setTargetAtTime(0.5, 0, 0.0001)
    this.input.connect(this.dry)
    this.input.connect(this.wet)
    this.irrArrayBuffer = irrArrayBuffer
    this.ctx.decodeAudioData(this.irrArrayBuffer, (audioBuffer) => {
      this.convolver = ctx.createConvolver()
      this.convolver.buffer = audioBuffer
      this.wet.connect(this.convolver)
      this.convolver.connect(this.output)
    })
  }

  static async create(ctx) {
    const response = await fetch('https://jjyyxx.github.io/webaudiofontdata/data/irr.bin', {
      mode: 'cors'
    })
    const irrArrayBuffer = await response.arrayBuffer()
    return new Reverberator(ctx, irrArrayBuffer)
  }
}
