/**
 * @class
 */
class MIDIAdapter {
  static adapt(tracks) {
    let endTime = 0
    return {
      tracks: tracks.map((track) => {
        endTime = Math.max(endTime, track.Content[0].StartTime + track.Meta.Duration)
        return {
          Instrument: track.Name.split('.')[1],
          Content: track.Content
        }
      }),
      time: endTime
    }
  }
}

module.exports = MIDIAdapter
