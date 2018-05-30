class TmAdapter {
  constructor(data, spec) {
    if (spec === undefined) {
      this.source = data
      return
    }
    this.source = []
    for (const section of spec) {
      if (section instanceof Object) {
        const tracks = []
        for (const track of section.Tracks) {
          tracks.push(data[section.Index].Tracks[track])
        }
        this.source.push({
          Tracks: tracks,
          Warnings: data[section.Index].Warnings
        })
      } else {
        this.source.push(data[section])
      }
    }
  }

  mergeSections() {
    const tracks = []
    let duration = 0
    this.source.forEach(section => {
      section.Tracks.forEach(track => {
        const data = track.Content.map(note => {
          return {
            Pitch: note.Pitch,
            Volume: note.Volume,
            Duration: note.Duration,
            StartTime: note.StartTime + duration
          }
        })
        let index = tracks.findIndex(t => t.Name === track.Name)
        if (index === -1) {
          index = tracks.length
          tracks.push({
            Name: track.Name,
            Meta: track.Meta,
            Settings: track.Settings,
            Content: []
          })
        }
        tracks[index].Content.push(...data)
        tracks[index].Meta.Duration = track.Meta.Duration + duration
      })
      duration += Math.max(...section.Tracks.map(track => track.Meta.Duration))
    })
    return tracks
  }

  adapt(form = 'MIDI') {
    if (form in TmAdapter.Library) {
      return TmAdapter.Library[form].adapt(this.source)
    } else {
      throw new Error('adaptation library not found!')
    }
  }
}

TmAdapter.Library = {
  MIDI: require('./MIDIAdapter')
}

module.exports = TmAdapter