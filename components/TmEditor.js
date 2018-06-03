const FileSaver = require('file-saver')
const TmDoc = require('./TmDoc')
const {registerPlayCommand} = require('../library/editor/Editor')

module.exports = {
  name: 'TmEditor',
  components: {
    TmDoc
  },
  data() {
    return {
      tabs: [],
      activeIndex: 0,
      type: 'tm',
      row: 1,
      column: 1
    }
  },
  computed: {
    remainHeight() {
      return `${this.height - 44 - 28}px`
    }
  },
  mounted() {
    this.player = undefined
    this.showEditor()
    this.tabs.push({
      title: 'foo',
      model: window.monaco.editor.createModel('foo', 'tm'),
      type: 'tm'
    })
    this.switchTab(0)
  },

  methods: {
    switchTab(index) {
      const tab = this.tabs[index]
      this.type = tab.type
      this.activeIndex = index
      this.editor.setModel(this.tabs[index].model)
      this.$nextTick(() => {
        this.editor.layout()
      })
    },

    addTab() {
      const tab = {
        title: 'New',
        model: window.monaco.editor.createModel('', 'tm')
      }
      this.tabs.push(tab)
      this.switchTab(this.tabs.length - 1)
    },

    closeTab(index) {
      this.tabs.splice(index, 1)
      if (this.tabs.length === 0) {
        this.addTab()
      } else if (index === this.activeIndex) {
        this.switchTab(0)
      } else if (index <= this.activeIndex) {
        this.activeIndex -= 1
      }
    },

    showEditor() {
      // const model = window.monaco.editor.createModel(
      //   localStorage.getItem('lastText'),
      //   'tm'
      // )
      const editor = window.monaco.editor.create(this.$el.children[1], {
        model: null,
        language: 'tm',
        theme: 'tm',
        folding: false
      })
      this.editor = editor
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
          const blob = new Blob([value], {type: 'text/plain;charset=utf-8'})
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
      editor.onDidChangeCursorPosition((e) => {
        this.row = e.position.lineNumber
        this.column = e.position.column
      })
      addEventListener('resize', e => {
        editor.layout()
      }, {passive: true})
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
      editor.updateOptions({mouseWheelZoom: true})
    }
  },
  props: ['width', 'height'],
  template: `<div :style="{width}" class="tm-container">
  <div class="tm-tab tm-header">
    <button v-for="(tab, index) in tabs" :key="index" @click="switchTab(index)" :class="{active: index === activeIndex}">
      {{tab.title}}
      <span @click.stop="closeTab(index)">&nbsp;X</span>
    </button>
    <span @click="addTab" class="topright">+</span>
  </div>
  <div class="tm-content" :style="{height: remainHeight}"></div>
  <div class="status">
    行{{row}}列{{column}}
  </div>
</div>`
}
