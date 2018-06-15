const Player = require('../../library/player')
const A2W = require('audiobuffer-to-wav')
const fs = require('fs')

module.exports = [
  {
    id: 'tm-play',
    label: 'Play',
    keybindings: [ window.monaco.KeyMod.CtrlCmd | window.monaco.KeyCode.KEY_P],
    precondition: null,
    keybindingContext: null,
    contextMenuGroupId: 'navigation',
    contextMenuOrder: 1.5,
    run: (editor) => {
      const value = editor.getModel().tab.value
      Player.update(value).play()
    }
  },
  {
    id: 'tm-pause-resume',
    label: 'Pause/Resume',
    keybindings: [ window.monaco.KeyMod.CtrlCmd | window.monaco.KeyCode.KEY_R],
    precondition: null,
    keybindingContext: null,
    contextMenuGroupId: 'navigation',
    contextMenuOrder: 1.5,
    run: (editor) => {
        Player.toggle()
    }
  },
  {
    id: 'tm-stop',
    label: 'Stop Playing',
    keybindings: [
      window.monaco.KeyMod.CtrlCmd | window.monaco.KeyCode.KEY_T
    ],
    precondition: null,
    keybindingContext: null,
    contextMenuGroupId: 'navigation',
    contextMenuOrder: 1.5,
    run() {
      Player.close()
    }
  },
  {
    id: 'tm-output',
    label: 'Output',
    keybindings: [
      window.monaco.KeyMod.CtrlCmd | window.monaco.KeyCode.KEY_O
    ],
    precondition: null,
    keybindingContext: null,
    contextMenuGroupId: 'navigation',
    contextMenuOrder: 1.5,
    run(editor) {
      const value = editor.getModel().tab.value
      Player.update(value, {offline: true}).play().then(() => {
        return Player.ctx.startRendering()
      }).then((buffer) => {
        fs.writeFile('test.wav', new Buffer(A2W(buffer)), () => {
          console.log('Hurray!')
        })
      })
    }
  }
]
