const {registerPlayCommand} = require('../../library/editor/Editor')
// annoying bypass
const tempAmd = global.define.amd
global.define.amd = null
const draggable = require('vuedraggable')
global.define.amd = tempAmd

const extensions = require('../../extensions/extension')
const storage = require('./storage')
const commands = require('./command')
const keymap = require('./keymap.json')
const Mousetrap = require('Mousetrap')

module.exports = {
  name: 'TmEditor',

  components: {
    draggable
  },
  data() {
    const data = storage.load()
    return {
      ...data,
      row: 1,
      column: 1,
      extensions,
      activeExtension: extensions[0],
      draggingExtension: false,
      dragOptions: {
        animation: 150,
        ghostClass: 'drag-ghost'
      },
      menuShowed: {
        tabs: false,
        tab: false
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
    'settings.lineEnding': function() {
      this.tabs.map(tab => this.refresh(tab))
    }
  },

  mounted() {
    this.menu = {
      tabs: this.$el.children[5].children[0],
      tab: this.$el.children[5].children[1]
    }
    this.actions = require('./action')
    for (const cmd in commands) {
      this[cmd] = commands[cmd]
    }
    keymap.forEach(command => {
      Mousetrap.bind(command.bind, () => {
        this[command.name]()
        return false
      })
    })

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

    this.$el.addEventListener('click', () => {
      this.hideContextMenus()
    })

    this.$el.addEventListener('contextmenu', () => {
      this.hideContextMenus()
    })

    this.$el.children[1].addEventListener('contextmenu', event => {
      event.stopPropagation()
      this.showTopContextMenu('tabs', event)
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
        global.user.state.Settings.lineEnding === 'LF' ? 1 : 2
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

    hideContextMenus() {
      for (const key in this.menuShowed) {
        this.menuShowed[key] = false
      }
    },

    showTopContextMenu(key, event) {
      const style = this.menu[key].style
      this.hideContextMenus()
      if (event.clientX + 200 > this.width) {
        style.left = event.clientX - 200 - this.left + 'px'
      } else {
        style.left = event.clientX - this.left + 'px'
      }
      style.top = event.clientY - this.top + 'px'
      this.menuShowed[key] = true
    },

    toggleTabMenu(id, event) {
      event.stopPropagation()
      this.menuTabId = id
      this.showTopContextMenu('tab', event)
    },

    activate() {
      this.editor.setModel(this.current.model)
      const position = this.editor.getPosition()
      this.row = position.lineNumber
      this.column = position.column
      global.user.state.Prefix.editor = this.current.title + ' - '
      this.layout()
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

      this.actions.forEach(action => editor.addAction(action))

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

      addEventListener('beforeunload', () => {
        storage.save(this)
      })
    },

    loadFileDropped(event) {
      for (const file of event.dataTransfer.files) {
        this.loadFile(file.path)
      }
    }
  },
  
  props: ['width', 'height', 'left', 'top'],
  render: VueCompile(`<div class="tm-editor" :class="{'show-toolbar': toolbar}"
  @dragover.stop.prevent @drop.stop.prevent="loadFileDropped">
  <div class="toolbar">
    <i class="icon-volume-mute"/>
    <div class="volume-slider">
      <el-slider class="icon-volume-mute" v-model="current.volume" :show-tooltip="false"/>
    </div>
  </div>
  <div class="header">
    <button class="toolbar-toggler" @click="toggleToolbar()"><i class="icon-control"/></button>
    <div class="tm-tabs">
      <draggable :list="tabs" :options="dragOptions">
        <transition-group name="tm-tabs">
        <button v-for="tab in tabs" @mousedown="switchTabById(tab.id, $event)" :key="tab.id">
          <div class="tm-tab" :class="{ active: tab.id === current.id, changed: tab.changed }">
            <i v-if="tab.changed" class="icon-circle" @mousedown.stop @click.stop="closeTab(tab.id)"/>
            <i v-else class="icon-close" @mousedown.stop @click.stop="closeTab(tab.id)"/>
            <div class="title" @contextmenu.stop="toggleTabMenu(tab.id, $event)">{{ tab.title }}</div>
            <div class="left-border"/>
            <div class="right-border"/>
          </div>
        </button>
        </transition-group>
      </draggable>
      <button class="add-tag" @click="addTab(false)"><i class="icon-add"/></button>
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
    <transition name="el-zoom-in-top">
      <ul v-show="menuShowed.tabs">
        <div class="menu-item" @click="addTab(false)">
          <a class="label">New File</a>
          <span class="binding">Ctrl+N</span>
        </div>
        <div class="menu-item" @click="openFile()">
          <a class="label">Open File</a>
          <span class="binding">Ctrl+O</span>
        </div>
        <div class="menu-item" @click="saveAll()">
          <a class="label">Save All Files</a>
        </div>
        <div class="menu-item disabled" @click.stop><a class="label separator"/></div>
        <li v-for="tab in tabs">
          <div class="menu-item" @click="switchTabById(tab.id, $event)">
            <a class="label">{{ tab.title }}</a>
          </div>
        </li>
      </ul>
    </transition>
    <transition name="el-zoom-in-top">
      <ul v-show="menuShowed.tab">
        <div class="menu-item" @click="save(menuTabId)">
          <a class="label">Save</a>
          <span class="binding">Ctrl+S</span>
        </div>
        <div class="menu-item" @click="saveAs(menuTabId)">
          <a class="label">Save As</a>
          <span class="binding">Ctrl+Shift+S</span>
        </div>
        <div class="menu-item disabled" @click.stop><a class="label separator"/></div>
        <div class="menu-item" @click="closeTab(menuTabId)">
          <a class="label">Close</a>
          <span class="binding">Ctrl+F4</span>
        </div>
        <div class="menu-item" @click="closeOtherTabs(menuTabId)">
          <a class="label">Close Other Tabs</a>
        </div>
        <div class="menu-item" @click="closeTabsToRight(menuTabId)">
          <a class="label">Close Tabs to the Right</a>
        </div>
      </ul>
    </transition>
  </div>
</div>`)
}
