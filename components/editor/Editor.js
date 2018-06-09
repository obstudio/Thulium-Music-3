const {registerPlayCommand} = require('../../library/editor/Editor')
// annoying bypass
const tempAmd = global.define.amd
global.define.amd = null
const draggable = require('vuedraggable')
global.define.amd = tempAmd

const extensions = require('../../extensions/extension')
const TmTab = require('./Tab')
const fs = require('fs')
const path = require('path')

module.exports = {
  name: 'TmEditor',

  components: {
    draggable
  },
  data() {
    return {
      tabs: TmTab.load(),
      activeIndex: 0,
      row: 1,
      column: 1,
      toolbar: false,
      extensions: extensions,
      extensionHeight: 200,
      extensionShowed: false,
      extensionFull: false,
      activeExtension: extensions[0]
    }
  },

  computed: {
    contentHeight() {
      return String(this.height - 40 - 24
        - (this.extensionShowed ? this.extensionHeight : 0)
        - (this.toolbar ? 40 : 0)
      ) + 'px'
    },
    settings: () => global.user.state.Settings,
    captions: () => global.user.state.Captions.editor
  },

  watch: {
    width() {
      this.layout(300)
    },
    toolbar() {
      this.layout(300)
    },
    extensionShowed() {
      this.layout(300)
    },
    settings() {
      if (this.editor) {
        this.editor.updateOptions({
          minimap: { enabled: this.settings.minimap }
        })
      }
    }
  },

  mounted() {
    this.commands = require('./command')
    this.player = undefined
    this.tabs.forEach(tab => tab.changed = tab.hasChanged())
    this.showEditor()
    if (global.user) {
      window.monaco.editor.setTheme(global.user.state.Settings.theme)
    }
    this.switchTab(0)
  },

  methods: {
    dragEnd(e) {
      this.switchTab(e.newIndex)
    },
    switchTab(index) {
      const tab = this.tabs[index]
      this.activeIndex = index
      this.editor.setModel(tab.model)
      const position = this.editor.getPosition()
      this.row = position.lineNumber
      this.column = position.column
      global.user.state.Prefix.editor = tab.title + ' - '
      this.layout()
    },

    addTab(content = {}, insert = false) {
      const index = insert ? this.activeIndex + 1 : this.tabs.length
      this.tabs.splice(index, 0, new TmTab(content))
      this.switchTab(index)
    },

    closeTab(index) {
      this.tabs.splice(index, 1)
      if (this.tabs.length === 0) {
        this.addTab()
      } else if (index === this.activeIndex) {
        this.switchTab(index === 0 ? 0 : index - 1)
      } else if (index <= this.activeIndex) {
        this.activeIndex -= 1
      }
    },

    layout(time = 0) {
      const now = performance.now(), self = this
      window.requestAnimationFrame(function layout(newTime) {
        self.editor._configuration.observeReferenceElement()
        self.editor._view._actualRender()
        if (newTime - now < time) {
          window.requestAnimationFrame(layout)
        }
      })
    },

    showEditor() {
      const editor = window.monaco.editor.create(this.$el.children[2], {
        model: null,
        language: 'tm',
        theme: 'tm',
        folding: false,
        minimap: { enabled: this.settings.minimap }
      })
      this.editor = editor
      registerPlayCommand(editor)

      this.commands.forEach(command => editor.addAction(command))

      editor.onDidChangeCursorPosition(event => {
        this.row = event.position.lineNumber
        this.column = event.position.column
        this.tabs[this.activeIndex].changed = this.tabs[this.activeIndex].hasChanged()
      })

      addEventListener('resize', () => {
        const remainHeight = this.height - 40 - 24 - (this.toolbar ? 40 : 0)
        if (this.extensionShowed && this.extensionHeight > remainHeight) {
          this.extensionHeight = remainHeight
        }
        this.layout(300)
      }, { passive: true })

      addEventListener('beforeunload', e => {
        TmTab.save(this.tabs)
      })

      this.$el.addEventListener('dragover', e => {
        e.preventDefault()
        e.stopPropagation()
      })

      this.$el.addEventListener('drop', e => {
        e.preventDefault()
        e.stopPropagation()
        for (const file of e.dataTransfer.files) {
          if (!['.tm', '.tml'].includes(path.extname(file.path))) continue
          fs.readFile(file.path, { encoding: 'utf8' }, (_, data) => {
            this.addTab({
              title: path.basename(file.path).replace(/\.tml?$/, ''),
              path: file.path,
              value: data,
              old: data
            }, true)
            if (this.tabs[this.activeIndex - 1].isEmpty()) {
              this.closeTab(this.activeIndex - 1)
            }
          })
        }
      })
      editor.updateOptions({mouseWheelZoom: true})
    }
  },
  
  props: ['width', 'height'],
  render: VueCompile(`<div class="tm-editor" :class="{'show-toolbar': toolbar}">
    <div class="toolbar">
      <i class="icon-volume-mute"/>
      <div class="volume-slider">
        <el-slider class="icon-volume-mute" v-model="tabs[activeIndex].volume" :show-tooltip="false"/>
      </div>
    </div>
    <div class="header">
      <button class="toolbar-toggler" @click="toolbar = !toolbar"><i class="icon-control"/></button>
      <div class="tm-tabs">
        <draggable :list="tabs" @end="dragEnd">
          <button v-for="(tab, index) in tabs" @mousedown="switchTab(index)" class="tm-tab"
            :key="index" :class="{ active: index === activeIndex, changed: tab.changed }">
            <i v-if="tab.changed" class="icon-circle" @click.stop="closeTab(index)"/>
            <i v-else class="icon-close" @click.stop="closeTab(index)"/>
            <div class="title">{{ tab.title }}</div>
          </button>
        </draggable>
        <button class="add-tag" @click="addTab()"><i class="icon-add"/></button>
      </div>
    </div>
    <div class="content" :style="{ height: contentHeight, width: '100%' }"/>
    <div class="extension" :style="{
      height: (extensionShowed && extensionFull ? '100%' : extensionHeight + 'px'),
      bottom: (extensionShowed ? extensionFull ? 0 : 24 : 24 - extensionHeight) + 'px'
    }">
      <div class="top-border"/>
      <el-tabs v-model="activeExtension" @tab-click="">
        <el-tab-pane v-for="ext in extensions" :label="ext" :key="ext" :name="ext">
          <component :is="'tm-ext-' + ext" :full="extensionFull"
            :height="extensionFull ? height : extensionHeight"/>
        </el-tab-pane>
      </el-tabs>
      <div class="nav-right">
        <button @click="extensionFull = !extensionFull">
          <i :class="extensionFull ? 'icon-down' : 'icon-up'"/>
        </button>
        <button @click="extensionShowed = false">
          <i class="icon-close"/>
        </button>
      </div>
    </div>
    <div class="status" :style="{ bottom: extensionShowed && extensionFull ? '-24px' : '0px' }">
      <div class="left">
        <div class="text">{{ $t('editor.line') }} {{ row }}, {{ $t('editor.column') }} {{ column }}</div>
      </div>
      <div class="right">
        <button @click="extensionShowed = !extensionShowed"><i class="el-icon-menu"/></button>
      </div>
    </div>
  </div>`)
}
