const FileSaver = require('file-saver')
const {registerPlayCommand} = require('../../library/editor/Editor')
const Tab = require('../../library/editor/Tab')

module.exports = {
  name: 'TmEditor',

  data() {
    return {
      tabs: Tab.load(true),
      activeIndex: 0,
      row: 1,
      column: 1
    }
  },

  computed: {
    remainHeight() {
      return `${this.height - 40 - 24}px`
    },
    settings: () => global.user.state.Settings,
    captions: () => global.user.state.Captions.editor
  },

  watch: {
    width() {
      this.layout()
    }
  },

  mounted() {
    this.player = undefined
    this.showEditor()
    if (global.user) {
      window.monaco.editor.setTheme(global.user.state.Settings.theme)
    }
    this.switchTab(0)
  },

  methods: {
    switchTab(index) {
      const tab = this.tabs[index]
      this.activeIndex = index
      this.editor.setModel(tab.model)
      const position = this.editor.getPosition()
      this.row = position.lineNumber
      this.column = position.column
      this.layout()
    },

    addTab() {
      this.tabs.push(new Tab())
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

    layout() {
      this.$nextTick(() => {
        this.editor.layout()
        // const minimap = document.getElementsByClassName('minimap')[0]
        // const canvas = minimap.getElementsByTagName('canvas')[0]
        // canvas.style.background = ''
      })
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
        this.layout()
      }, {passive: true})
      addEventListener('beforeunload', e => {
        Tab.save(this.tabs)
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
  render: VueCompile(`<div class="tm-editor">
    <div class="header">
      <button class="toolbar-toggler" @click="addTab">+</button>
      <div class="tm-tabs">
        <button v-for="(tab, index) in tabs" @click="switchTab(index)"
          :key="index" :class="{ active: index === activeIndex }">
          {{ tab.title }}
          <span @click.stop="closeTab(index)">&nbsp;X</span>
        </button>
      </div>
    </div>
    <div class="content"
      :class="{'hide-minimap': !settings.minimap}"
      :style="{height: remainHeight, width: width + 'px'}"/>
    <div class="status">
      {{ captions.line }} {{ row }}, {{ captions.column }} {{ column }}
    </div>
  </div>`)
}
