const FileSaver = require('file-saver')

module.exports = [
  {
    id: 'tm-save',
    label: 'Save File',
    keybindings: [ window.monaco.KeyMod.CtrlCmd | window.monaco.KeyCode.KEY_S ],
    precondition: null,
    keybindingContext: null,
    contextMenuGroupId: 'navigation',
    contextMenuOrder: 1.5,
    run(editor) {
      const value = editor.getValue()
      localStorage.setItem('lastText', value)
      const firstLine = value.slice(0, value.indexOf('\n'))
      let name
      if (firstLine !== '' && firstLine.startsWith('//')) {
        name = firstLine.slice(2).trim()
      } else {
        name = 'new_file'
      }
      const blob = new Blob([value], {type: 'text/plain;charset=utf-8'})
      FileSaver.saveAs(blob, `${name}.sml`)
    }
  },

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