/**
 * @class
 * @implements {Tm.Adapter}
 */
export default class MIDIAdapter {
  adapt(parsedSection) {
    let prevTime = 0
    const trackMap = {}
    for (const section of parsedSection) {
      const durs = []
      for (const track of section.Tracks) {
        durs.push(track.Meta.Duration)
        for (const note of track.Content) {
          note.StartTime += prevTime
        }
        if (track.ID in trackMap) {
          trackMap[track.ID].Meta.Duration += track.Meta.Duration
          trackMap[track.ID].Content.push(...track.Content)
        } else {
          trackMap[track.ID] = track
        }
      }
      prevTime += Math.max(...durs)
    }
    return {
      tracks: Object.values(trackMap),
      time: prevTime
    }
  }
}
