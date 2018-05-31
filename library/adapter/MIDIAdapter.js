/**
 * @class
 * @implements {Tm.Adapter}
 */
class MIDIAdapter {
  static adapt(tracks) {
    const trackMap = {}
    const durs = []
    for (const track of tracks) {
      durs.push(track.Meta.Duration)
      if (track.ID in trackMap) {
        trackMap[track.ID].Meta.Duration += track.Meta.Duration
        trackMap[track.ID].Content.push(...track.Content)
      } else {
        trackMap[track.ID] = track
      }
    }
    return {
      tracks: Object.values(trackMap),
      time: Math.max(...durs)
    }
  }
}
module.exports = MIDIAdapter
