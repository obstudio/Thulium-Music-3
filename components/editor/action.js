const Player = require('../../library/player')

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
  }
]
