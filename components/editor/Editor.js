const {registerPlayCommand} = require('../../library/editor/Editor')
// annoying bypass
const tempAmd = global.define.amd
global.define.amd = null
const draggable = require('vuedraggable')
global.define.amd = tempAmd

const extensions = require('../../extensions/extension')
const storage = require('./storage')
const menus = require('./menu.json').menubar
const keymap = require('./keymap.json')
const Mousetrap = require('mousetrap')

// TODO: improve this pattern maybe. 
// Cause: firing event inside textarea is blocked by mousetrap by default.
Mousetrap.prototype.stopCallback = () => false

const HalfTitleHeight = 34
const FullTitleHeight = 60
const StatusHeight = 24
const commands = {}

function toKebab(camel) {
  return camel.replace(/[A-Z]/g, char => '-' + char.toLowerCase())
}

for (const command of require('./command.json')) {
  const key = command.key ? command.key : toKebab(command.method)
  commands[key] = command
}

module.exports = {
  name: 'TmEditor',

  components: {
    draggable
  },
  data() {
    const storageState = storage.load()
    const editorState = {
      row: 1,
      column: 1
    }
    const tabState = {
      dragOptions: {
        animation: 150,
        ghostClass: 'drag-ghost'
      },
      draggingTab: false
    }
    const extensionState = {
      extensions,
      activeExtension: extensions[0],
      draggingExtension: false,
    }
    const menuState = {
      menus,
      menuShowed: {
        tabs: false,
        tab: false,
        top: new Array(menus.length).fill(false)
      }
    }
    return {
      ...storageState,
      ...editorState,
      ...tabState,
      ...extensionState,
      ...menuState,
      keymap
    }
  },

  computed: {
    contentHeight() {
      return String(this.remainHeight - (this.extensionShowed ? this.extensionHeight : 0)) + 'px'
    },
    remainHeight() {
      return this.height - StatusHeight - (this.menubar ? FullTitleHeight : HalfTitleHeight)
    },
    settings: () => global.user.state.Settings
  },

  watch: {
    width() {
      this.layout(300)
    },
    menubar() {
      this.layout(300)
    },
    extensionShowed() {
      this.layout(300)
    },
    'settings.minimap'() {
      if (this.editor) {
        this.editor.updateOptions({
          minimap: { enabled: this.settings.minimap }
        })
      }
    },
    'settings.lineEnding'() {
      this.tabs.map(tab => this.refresh(tab))
    }
  },

  mounted() {
    // properties added in mounted hook to prevent unnecessary reactivity
    this.menu = {
      tabs: this.$el.children[4].children[0],
      tab: this.$el.children[4].children[1],
      top: this.$el.children[4].children[2]
    }
    this.player = undefined

    for (const key in keymap) {
      if (!(key in commands) || keymap[key].startsWith('!')) continue
      Mousetrap.bind(keymap[key], () => {
        this.executeCommand(key)
        return false
      })
    }

    this.tabs.forEach(tab => {
      tab.onModelChange((e) => {
        this.refresh(tab, e)
      })
      tab.checkChange()
    })
    this.showEditor()
    this.registerGlobalEvents()
    if (global.user) {
      window.monaco.editor.setTheme(global.user.state.Settings.theme)
    }
    this.activate()
  },

  methods: {
    // commands
    ...require('./method'),
    displayKeyBinding(binding) {
      if (binding.charAt(0) === '!') binding = binding.slice(1)
      return binding.replace(/[a-z]+/g, word => {
        return word.charAt(0).toUpperCase() + word.slice(1)
      })
    },
    getContextValue(key) {
      if (commands[key].context) {
        // FIXME: optimize context pattern
        return this[commands[key].context.slice(1)] ? '.1' : '.0'
      } else {
        return ''
      }
    },
    activate() {
      this.editor.setModel(this.current.model)
      if (this.current.viewState) this.editor.restoreViewState(this.current.viewState)
      const position = this.editor.getPosition()
      this.row = position.lineNumber
      this.column = position.column
      global.user.state.Prefix.editor = this.current.title + ' - '
      this.layout()
    },
    refresh(tab, event) {
      tab.latestVersionId = event.versionId
      tab.checkChange()
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
    executeAction(id) {
      this.editor.getAction('editor.action.' + id).run(this.editor)
    },
    executeTrigger(id) {
      this.editor.trigger(id, id)
    },
    executeCommand(key) {
      let args = commands[key].arguments
      if (args === undefined) args = []
      if (!(args instanceof Array)) args = [args]
      this[commands[key].method](...args.map(arg => {
        if (typeof arg === 'string' && arg.startsWith('$')) {
          return this[arg.slice(1)]
        } else {
          return arg
        }
      }))
    },
    showEditor() {
      const editor = window.monaco.editor.create(this.$el.children[1], {
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
      require('./action').forEach(action => editor.addAction(action))
      editor.onDidChangeCursorPosition(event => {
        this.row = event.position.lineNumber
        this.column = event.position.column
      })
      editor.onDidChangeModel(() => {
        this.$nextTick(() => editor.focus())
      })
    },
    registerGlobalEvents() {
      addEventListener('resize', () => {
        if (this.extensionShowed && this.extensionHeight > this.remainHeight) {
          this.extensionHeight = this.remainHeight
        }
        this.layout(300)
      }, {passive: true})
      addEventListener('mouseup', (e) => {
        this.layout()
        this.stopDrag(e)
      }, {passive: true})
      addEventListener('mousemove', (event) => {
        if (this.draggingExtension) {
          this.layout()
          event.stopPropagation()
          if (this.extensionHeight <= this.remainHeight || this.draggingLastY < event.clientY) {
            this.extensionHeight += this.draggingLastY - event.clientY
            this.draggingLastY = event.clientY
          }
        }
      })
      addEventListener('beforeunload', () => {
        storage.save(this)
      })
      addEventListener('dragend', (e) => {
        this.layout()
        this.stopDrag(e)
      })
    },

    // event handlers
    loadFileDropped(event) {
      for (const file of event.dataTransfer.files) {
        this.loadFile(file.path)
      }
    },
    toggleTabMenu(id, event) {
      this.menuTabId = id
      this.showContextMenu('tab', event)
    },
    startDrag(event) {
      this.draggingExtension = true
      this.draggingLastY = event.clientY
    },
    stopDrag() {
      this.draggingExtension = false
    },
    hideContextMenus() {
      for (const key in this.menuShowed) {
        if (this.menuShowed[key] instanceof Array) {
          this.menuShowed[key] = new Array(this.menuShowed[key].length).fill(false)
        } else {
          this.menuShowed[key] = false
        }
      }
    },
    showContextMenu(key, event) {
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
    showMenu(index, event) {
      if (this.menuShowed.top[index]) {
        this.menuShowed.top.splice(index, 1, false)
        return
      }
      const style = this.menu.top.children[index].children[0].style
      this.hideContextMenus()
      if (event.target.offsetLeft + 200 > this.width) {
        style.left = event.target.offsetLeft + event.target.offsetWidth - 200 + 'px'
      } else {
        style.left = event.target.offsetLeft + 'px'
      }
      style.top = event.target.offsetTop + event.target.offsetHeight + 'px'
      this.menuShowed.top[index] = true
    }
  },

  props: ['width', 'height', 'left', 'top'],
  render: VueCompile(`<div class="tm-editor" :class="{'show-menubar': menubar}"
  @dragover.stop.prevent @drop.stop.prevent="loadFileDropped" @click="hideContextMenus" @contextmenu="hideContextMenus">
  <div class="header" @contextmenu.stop="showContextMenu('tabs', $event)">
    <div class="menubar">
      <div v-for="(menu, index) in menus" class="tm-top-menu"
        @contextmenu.stop @click.stop="showMenu(index, $event)">
        {{ menu.key }} (<span>{{ menu.bind }}</span>)
      </div>
    </div>
    <div class="tm-tabs">
      <draggable :list="tabs" :options="dragOptions" @start="draggingTab = true" @end="draggingTab = false">
        <transition-group name="tm-tabs" :move-class="draggingTab ? 'dragged' : ''">
        <button v-for="tab in tabs" @mousedown.left="switchTabById(tab.id)" @click.middle.prevent.stop="closeTab(tab.id)" :key="tab.id">
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
    <button class="menubar-toggler" @click="toggleMenubar()"><i class="icon-control"/></button>
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
  <div class="context-menu">
    <transition name="el-zoom-in-top">
      <ul v-show="menuShowed.tabs" class="tm-menu">
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
      <ul v-show="menuShowed.tab" class="tm-menu">
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
    <div>
      <div v-for="(menu, index) in menus">
        <transition name="el-zoom-in-top">
          <ul v-show="menuShowed.top[index]" class="tm-menu">
            <li v-for="item in menu.content">
              <div v-if="item === '@separator'" class="menu-item disabled" @click.stop>
                <a class="label separator"/>
              </div>
              <div v-else-if="item === '@tabs'">
                <li v-for="tab in tabs">
                  <div class="menu-item" @click="switchTabById(tab.id, $event)">
                    <a class="label">{{ tab.title }}</a>
                  </div>
                </li>
              </div>
              <div v-else-if="typeof item === 'string'" class="menu-item" @click="executeCommand(item)">
                <a class="label">{{ $t('editor.menu.' + item + getContextValue(item)) }}</a>
                <span v-if="item in keymap" class="binding">
                  {{ displayKeyBinding(keymap[item]) }}
                </span>
              </div>
            </li>
          </ul>
        </transition>
      </div>
    </div>
  </div>
</div>`)
}
