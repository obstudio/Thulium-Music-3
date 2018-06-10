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
    const tabs = TmTab.load()
    let current = null
    for (const tab of tabs) {
      if (tab.active) current = tab
    }
    if (!current) current = tabs[0]
    return {
      current: current,
      tabs: tabs,
      row: 1,
      column: 1,
      toolbar: false,
      extensions: extensions,
      extensionHeight: 200,
      extensionShowed: false,
      extensionFull: false,
      activeExtension: extensions[0],
      draggingTab: false,
      draggingExtension: false,
      draggingLastY: 0,
      dragOptions: {
        animation: 150,
        ghostClass: 'drag-ghost'
      }
    }
  },

  computed: {
    contentHeight() {
      return String(this.height - 34 - 24
        - (this.extensionShowed ? this.extensionHeight : 0)
        - (this.toolbar ? 34 : 0)
      ) + 'px'
    },
    settings: () => global.user.state.Settings
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
    'settings.minimap': function() {
      if (this.editor) {
        this.editor.updateOptions({
          minimap: { enabled: this.settings.minimap }
        })
      }
    },
    'settings.line-ending': function() {
      this.tabs.map(tab => this.refresh(tab))
    }
  },

  mounted() {
    this.commands = require('./command')
    this.player = undefined
    this.tabs.forEach(tab => tab.checkChange())
    this.showEditor()

    addEventListener('mouseup', (e) => {
      this.layout()
      this.stopDrag(e)
    }, { passive: true })

    addEventListener('mousemove', (event) => {
      if (this.draggingExtension) {
        this.layout()
        event.stopPropagation()
        const remainHeight = this.height - 34 - 24 - (this.toolbar ? 34 : 0)
        if (this.extensionHeight <= remainHeight || this.draggingLastY < event.clientY) {
          this.extensionHeight += this.draggingLastY - event.clientY
          this.draggingLastY = event.clientY
        }
      }
    }, { passive: true })

    this.$el.children[2].addEventListener('contextmenu', event => {
      const menu$ = this.$el.children[5].children[0]
      if(event.clientX + 242 > screen.availWidth) {
        menu$.style.left = event.clientX - 242 + 'px'
      } else {
        menu$.style.left = event.clientX + 'px'
      }
      if (event.clentY + 122 > screen.availHeight) {
        menu$.style.top = event.clientY - 122 + 'px'
      } else {
        menu$.style.top = event.clientY + 'px'
      }
      menu$.style.visibility = 'visible'
      return false
    })

    addEventListener('dragend', (e) => {
      this.layout()
      this.stopDrag(e)
    })

    if (global.user) {
      window.monaco.editor.setTheme(global.user.state.Settings.theme)
    }
    this.activate()
  },

  methods: {
    refresh(tab = this.current) {
      tab.value = tab.model.getValue(
        global.user.state.Settings['line-ending'] === 'LF' ? 1 : 2
      )
      tab.checkChange()
    },

    startDrag(event) {
      this.draggingExtension = true
      this.draggingLastY = event.clientY
    },
    
    stopDrag(event) {
      this.draggingExtension = false
    },

    toggleToolbar() {
      if (this.toolbar) {
        this.toolbar = false
      } else {
        this.toolbar = true
        const remainHeight = this.height - 34 - 24 - 34
        if (this.extensionHeight > remainHeight) {
          this.extensionHeight = remainHeight
        }
      }
    },

    switchTabById(id, event) {
      if (event.buttons !== 1) return
      this.current = this.tabs.find(tab => tab.id === id)
      this.activate()
    },

    switchTabByIndex(index) {
      this.current = this.tabs[index]
      this.activate()
    },

    activate() {
      this.editor.setModel(this.current.model)
      const position = this.editor.getPosition()
      this.row = position.lineNumber
      this.column = position.column
      global.user.state.Prefix.editor = this.current.title + ' - '
      this.layout()
    },

    addTab(data = {}, insert = false) {
      const index = !insert ? this.tabs.length
        : this.tabs.findIndex(tab => tab.id === this.current.id) + 1
      this.tabs.splice(index, 0, new TmTab(data))
      this.switchTabByIndex(index)
    },

    closeTab(id) {
      const index = this.tabs.findIndex(tab => tab.id === id)
      this.tabs.splice(index, 1)
      if (this.tabs.length === 0) {
        this.addTab()
      } else if (this.current.id === id) {
        this.switchTabByIndex(index === 0 ? 0 : index - 1)
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
        mouseWheelZoom: true,
        minimap: { enabled: this.settings.minimap }
      })
      this.editor = editor
      editor.vue = this
      registerPlayCommand(editor)

      this.commands.forEach(command => editor.addAction(command))

      editor.onDidChangeCursorPosition(event => {
        this.row = event.position.lineNumber
        this.column = event.position.column
        this.refresh()
      })

      addEventListener('resize', () => {
        const remainHeight = this.height - 34 - 24 - (this.toolbar ? 34 : 0)
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
            const previous = this.current
            this.addTab({
              title: path.basename(file.path).replace(/\.tml?$/, ''),
              path: file.path,
              value: data,
              origin: data
            }, true)
            if (previous.isEmpty()) this.closeTab(previous.id)
          })
        }
      })
    }
  },
  
  props: ['width', 'height'],
  render: VueCompile(`<div class="tm-editor" :class="{'show-toolbar': toolbar}">
  <div class="toolbar">
    <i class="icon-volume-mute"/>
    <div class="volume-slider">
      <el-slider class="icon-volume-mute" v-model="current.volume" :show-tooltip="false"/>
    </div>
  </div>
  <div class="header">
    <button class="toolbar-toggler" @click="toggleToolbar()"><i class="icon-control"/></button>
    <div class="tm-tabs">
      <draggable :list="tabs" :options="dragOptions" @start="draggingTab = true" @end="draggingTab = false">
        <transition-group name="tm-tabs">
          <button v-for="tab in tabs" @mousedown="switchTabById(tab.id, $event)" :key="tab.id">
            <div class="tm-tab" :class="{ active: tab.id === current.id, changed: tab.changed }">
              <i v-if="tab.changed" class="icon-circle" @mousedown.stop @click.stop="closeTab(tab.id)"/>
              <i v-else class="icon-close" @mousedown.stop @click.stop="closeTab(tab.id)"/>
              <div class="title">{{ tab.title }}</div>
              <div class="left-border"/>
              <div class="right-border"/>
            </div>
          </button>
        </transition-group>
      </draggable>
      <button class="add-tag" @click="addTab()"><i class="icon-add"/></button>
    </div>
  </div>
  <div class="content" :class="{ dragged: draggingExtension }" :style="{ height: contentHeight }"/>
  <div class="extension" :class="{ dragged: draggingExtension }" :style="{
      height: (extensionShowed && extensionFull ? '100%' : extensionHeight + 'px'),
      bottom: (extensionShowed ? extensionFull ? 0 : 24 : 24 - extensionHeight) + 'px'
    }">
    <div class="top-border" @mousedown="startDrag"/>
    <el-tabs v-model="activeExtension" @tab-click="">
      <el-tab-pane v-for="ext in extensions" :label="ext" :key="ext" :name="ext">
        <component :is="'tm-ext-' + ext" :full="extensionFull" :line="row" :col="column"
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
      <div class="text">{{ $t('editor.line-col', { line: row, col: column }) }}</div>
    </div>
    <div class="right">
      <button @click="extensionShowed = !extensionShowed"><i class="el-icon-menu"/></button>
    </div>
  </div>
  <div class="tm-editor-menu">
    <ul class="window-menu">
      <li>Menu Item 1</li>
      <li>Menu Item 2</li>
    </ul>
  </div>
</div>`)
}
