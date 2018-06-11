module.exports = [
  {
    id: 'tm-play',
    label: 'Play/Pause',
    keybindings: [ window.monaco.KeyMod.CtrlCmd | window.monaco.KeyCode.KEY_P],
    precondition: null,
    keybindingContext: null,
    contextMenuGroupId: 'navigation',
    contextMenuOrder: 1.5,
    run: (editor) => {
      const value = editor.getValue()
      if (this.player) {
        if (this.player.value === value) {
          this.player.toggle()
        } else {
          this.player.close()
          this.player = this.$createPlayer(value)
          this.player.play()
        }
      } else {
        this.player = this.$createPlayer(value)
        this.player.play()
      }
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
      if (this.player) {
        this.player.close()
        this.player = undefined
      }
    }
  }
]
