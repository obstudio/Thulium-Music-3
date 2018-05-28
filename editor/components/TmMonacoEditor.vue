<template>
  <div :style="{width, height}"></div>
</template>

<script>
import * as FileSaver from 'file-saver'
import TmLoading from './TmLoading.vue'
import { registerPlayCommand } from '@/Editor'
export default {
  name: 'TmMonacoEditor',
  components: {
    TmLoading
  },
  data() {
    return {}
  },
  mounted() {
    this.player = undefined
    this.showEditor()
  },
  methods: {
    showEditor() {
      const model = window.monaco.editor.createModel(
        localStorage.getItem('lastText'),
        'tm'
      )
      const editor = window.monaco.editor.create(this.$el, {
        model,
        language: 'tm',
        theme: 'tm',
        folding: false
      })
      registerPlayCommand(editor)
      editor.addAction({
        id: 'tm-save',
        label: 'Save File',
        keybindings: [
          window.monaco.KeyMod.CtrlCmd | window.monaco.KeyCode.KEY_S
        ],
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
          const blob = new Blob([value], { type: 'text/plain;charset=utf-8' })
          FileSaver.saveAs(blob, `${name}.sml`)
        }
      })
      editor.addAction({
        id: 'tm-play',
        label: 'Play/Pause',
        keybindings: [
          window.monaco.KeyMod.CtrlCmd | window.monaco.KeyCode.KEY_P
        ],
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
      })
      editor.addAction({
        id: 'tm-stop',
        label: 'Stop Playing',
        keybindings: [
          window.monaco.KeyMod.CtrlCmd | window.monaco.KeyCode.KEY_T
        ],
        precondition: null,
        keybindingContext: null,
        contextMenuGroupId: 'navigation',
        contextMenuOrder: 1.5,
        run(editor) {
          if (this.player) {
            this.player.close()
            this.player = undefined
          }
        }
      })
      addEventListener('resize', e => {
        editor.layout()
      })
      addEventListener('beforeunload', e => {
        const value = editor.getValue()
        if (value !== '') {
          localStorage.setItem('lastText', value)
        }
      })
      this.$el.addEventListener('drop', e => {
        e.preventDefault()
        const dt = e.dataTransfer
        if (dt.items) {
          if (dt.items[0].kind === 'file') {
            const f = dt.items[0].getAsFile()
            const fr = new FileReader()
            fr.readAsText(f)
            fr.onload = () =>
              editor.executeEdits('dnd', [
                {
                  identifier: 'drag & drop',
                  range: new window.monaco.Range(
                    1,
                    1,
                    editor.getModel().getLineCount(),
                    editor
                      .getModel()
                      .getLineMaxColumn(editor.getModel().getLineCount())
                  ),
                  text: fr.result
                }
              ])
          }
        }
      })
      this.$el.addEventListener('dragover', e => e.preventDefault())
      editor.updateOptions({ mouseWheelZoom: true })
    }
  },
  props: ['width', 'height']
}
</script>

<style>
.fade {
    transition-property: opacity;
    transition-duration: 2s;
    transition-delay: 1s;
    transition-timing-function: cubic-bezier(0.19, 1, 0.22, 1)
}
</style>
