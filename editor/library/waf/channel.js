class Channel {
  /**
   * ??
   * @param {AudioContext} ctx
   */
  constructor(ctx) {
    this.audioContext = ctx
    this.input = this.audioContext.createDynamicsCompressor()
    this.input.threshold.setValueAtTime(-3, 0)
    this.input.knee.setValueAtTime(30, 0)
    this.input.ratio.setValueAtTime(12, 0)
    this.input.attack.setValueAtTime(0.05, 0)
    this.input.release.setValueAtTime(0.08, 0)
    this.band32 = this.bandEqualizer(this.input, 32)
    this.band64 = this.bandEqualizer(this.band32, 64)
    this.band128 = this.bandEqualizer(this.band64, 128)
    this.band256 = this.bandEqualizer(this.band128, 256)
    this.band512 = this.bandEqualizer(this.band256, 512)
    this.band1k = this.bandEqualizer(this.band512, 1024)
    this.band2k = this.bandEqualizer(this.band1k, 2048)
    this.band4k = this.bandEqualizer(this.band2k, 4096)
    this.band8k = this.bandEqualizer(this.band4k, 8192)
    this.band16k = this.bandEqualizer(this.band8k, 16384)
    this.output = ctx.createGain()
    this.band16k.connect(this.output)
  }

  bandEqualizer(from, frequency) {
    const filter = this.audioContext.createBiquadFilter()
    filter.frequency.setTargetAtTime(frequency, 0, 0.0001)
    filter.type = 'peaking'
    filter.gain.setTargetAtTime(0, 0, 0.0001)
    filter.Q.setTargetAtTime(1.0, 0, 0.0001)
    from.connect(filter)
    return filter
  }
}

module.exports = Channel