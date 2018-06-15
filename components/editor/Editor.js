const {registerPlayCommand} = require('../../library/editor/Editor')
// annoying bypass
const tempAmd = global.define.amd
global.define.amd = null
const draggable = require('vuedraggable')
global.define.amd = tempAmd

const extensions = require('../../extensions/extension')
const TmCommand = require('./command')
const TmMenu = require('./menu')
const storage = require('./storage')
const menus = require('./menu.json')

const HalfTitleHeight = 34
const FullTitleHeight = 60
const StatusHeight = 28

module.exports = {
  name: 'TmEditor',

  components: {
    TmMenu,
    draggable
  },
  provide() {
    return {
      tabs: this.tabs,
      tab: this.current,
      contextId: this.contextId,
      execute: this.executeMethod
    }
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
      draggingTab: false,
      addTagLeft: 0
    }
    const extensionState = {
      extensions,
      activeExtension: 0,
      draggingExtension: false,
      extUnderlineLeft: '0px',
      extUnderlineWidth: '0px',
      extensionMoveToRight: false
    }
    const menuState = {
      menus,
      menuShowed: {
        header: false,
        tab: false,
        top: new Array(menus.menubar.length).fill(false)
      },
      altKey: false,
      contextId: null
    }
    return {
      ...storageState,
      ...editorState,
      ...tabState,
      ...extensionState,
      ...menuState
    }
  },

  computed: {
    contentHeight() {
      return String(this.remainHeight - (this.extensionShowed ? this.extensionHeight : 0)) + 'px'
    },
    remainHeight() {
      return this.height - StatusHeight - (this.menubar ? FullTitleHeight : HalfTitleHeight)
    },
    settings: () => global.user.state.Settings,
    tabsWidth() {
      this.adjustTabsScroll()
      return this.addTagLeft < this.width - 34 ? `100%` : `${this.width - 34}px`
    }
  },

  watch: {
    width() {
      this.layout(500)
    },
    menubar() {
      this.layout(500)
    },
    extensionShowed() {
      this.layout(500)
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
    },
    current() {
      this.adjustTabsScroll()
    }
  },

  mounted() {
    // properties added in mounted hook to prevent unnecessary reactivity
    this.menu = {
      header: this.$refs.menus.children[0],
      tab: this.$refs.menus.children[1],
      top: this.$refs.menus.children[2]
    }
    this.player = undefined

    TmCommand.onMount.call(this)

    this.tabs.forEach(tab => {
      tab.onModelChange((e) => {
        this.refresh(tab, e)
      })
      tab.checkChange()
    })
    this.refreshExtUnderline()
    this.refreshAddTagLeft()
    this.adjustTabsScroll()
    this.showEditor()
    this.registerGlobalEvents()
    window.monaco.editor.setTheme(global.user.state.Settings.theme)
    this.activate()
  },

  methods: {
    // commands
    ...require('./method'),
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
    refreshAddTagLeft() {
      requestAnimationFrame(() => {
        const left = this.tabs.reduce((pre, cur, index) => {
          return pre + this.$refs.tabs.$el.children[index].clientWidth
        }, 0)
        this.addTagLeft = Math.min(this.width - 34, left)
      })
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
      const action = this.editor.getAction(id)
      if (action) action.run(this.editor)
    },
    executeTrigger(id) {
      this.editor.trigger(id, id)
    },
    executeCommand(key) {
      TmCommand.executeCommand.call(this, key)
    },
    executeMethod(method, ...args) {
      if (method in this) this[method](...args)
    },
    showEditor() {
      const editor = window.monaco.editor.create(this.$refs.content, {
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
        this.layout(500)
      }, {passive: true})
      addEventListener('mouseup', (e) => {
        this.layout()
        this.stopDrag(e)
      }, {passive: true})
      addEventListener('mousemove', (event) => {
        if (this.draggingExtension) {
          this.layout()
          event.stopPropagation()
          const toMax = this.extensionHeight <= this.remainHeight || this.draggingLastY < event.clientY
          const toMin = this.extensionHeight >= 36 || this.draggingLastY > event.clientY
          if (toMax && toMin) {
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
    adjustTabsScroll() {
      requestAnimationFrame((p) => {
        const index = this.tabs.indexOf(this.current)
        const tabsNode = this.$refs.tabs.$el
        const left = tabsNode.children[index].offsetLeft
        const width = tabsNode.children[index].clientWidth
        const scroll = tabsNode.scrollLeft
        if (scroll < left + width - tabsNode.clientWidth) {
          tabsNode.scrollLeft = left + width - tabsNode.clientWidth
        } else if (scroll > left) {
          tabsNode.scrollLeft = left
        }
      })
    },

    // event handlers
    loadFileDropped(event) {
      for (const file of event.dataTransfer.files) {
        this.loadFile(file.path)
      }
    },
    toggleTabMenu(id, event) {
      this.contextId = id
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
      this.contextId = null
      if (this.menuShowed.top[index]) {
        this.menuShowed.top.splice(index, 1, false)
        return
      }
      const style = this.menu.top.children[index].children[0].style
      this.hideContextMenus()
      if (event.currentTarget.offsetLeft + 200 > this.width) {
        style.left = event.currentTarget.offsetLeft + event.currentTarget.offsetWidth - 200 + 'px'
      } else {
        style.left = event.currentTarget.offsetLeft + 'px'
      }
      style.top = event.currentTarget.offsetTop + event.currentTarget.offsetHeight + 'px'
      this.menuShowed.top[index] = true
    },
    scrollTab(e) {
      e.currentTarget.scrollLeft += e.deltaY
    },
    changeExtension(id) {
      if (this.activeExtension === id) return
      this.extensionMoveToRight = id > this.activeExtension
      this.activeExtension = id
      this.refreshExtUnderline()
    },
    refreshExtUnderline() {
      const current = this.$refs.exts.children[this.activeExtension]
      this.extUnderlineLeft = current.offsetLeft + 8 + 'px'
      this.extUnderlineWidth = current.offsetWidth - 16 + 'px'
    },
    getExtensionName(ext) {
      if (global.user.state.Settings.language in ext.i18n) {
        return ext.i18n[global.user.state.Settings.language]
      } else {
        return ext.i18n.default
      }
    }
  },

  props: ['width', 'height', 'left', 'top'],
  render: VueCompile(`<div class="tm-editor" :class="{'show-menubar': menubar}"
    @dragover.stop.prevent @drop.stop.prevent="loadFileDropped"
    @click="hideContextMenus" @contextmenu="hideContextMenus">
  <div class="header" @contextmenu.stop="showContextMenu('header', $event)">
    <div class="menubar">
      <div v-for="(menu, index) in menus.menubar" class="tm-top-menu"
        @contextmenu.stop @click.stop="showMenu(index, $event)">
        {{ $t('editor.menu.' + menu.key) }} (<span>{{ menu.bind }}</span>)
      </div>
    </div>
    <div class="tm-tabs">
      <draggable :list="tabs" :options="dragOptions" @start="draggingTab = true" @end="draggingTab = false">
        <transition-group tag="div" ref="tabs" name="tm-tabs" :move-class="draggingTab ? 'dragged' : ''" class="tm-scroll-tabs" :style="{width: tabsWidth}" @wheel.prevent.stop.native="scrollTab">
        <button v-for="tab in tabs" @mousedown.left="switchTabById(tab.id)" @click.middle.prevent.stop="closeTab(tab.id)" :key="tab.id" class="tm-scroll-tab">
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
      <button class="add-tag" @click="addTab(false)" :style="{ left: addTagLeft + 'px' }">
        <i class="icon-add"/>
      </button>
    </div>
  </div>
  <div class="content" ref="content"
    :class="{ dragged: draggingExtension }" :style="{ height: contentHeight }"/>
  <div class="extension" :class="{ dragged: draggingExtension }" :style="{
      height: (extensionShowed && extensionFull ? '100%' : extensionHeight + 'px'),
      bottom: (extensionShowed ? extensionFull ? 0 : 28 : 28 - extensionHeight) + 'px'
    }">
    <div class="top-border" v-show="!extensionFull" @mousedown="startDrag"/>
    <div class="nav-left" ref="exts">
      <button v-for="(ext, index) in extensions" @click="changeExtension(index)"
        :key="ext.name" :class="{ active: activeExtension === index }">
        {{ getExtensionName(ext) }}
      </button>
    </div>
    <div class="underline" :style="{ left: extUnderlineLeft, width: extUnderlineWidth }"/>
    <div class="nav-right">
      <button @click="extensionFull = !extensionFull">
        <i :class="extensionFull ? 'icon-down' : 'icon-up'"/>
      </button>
      <button @click="extensionShowed = false">
        <i class="icon-close"/>
      </button>
    </div>
    <keep-alive>
      <transition name="tm-ext"
        :leave-to-class="'tm-ext-to-' + (extensionMoveToRight ? 'left' : 'right')"
        :enter-class="'tm-ext-to-' + (extensionMoveToRight ? 'right' : 'left')">
        <component :is="'tm-ext-' + extensions[activeExtension].name" class="tm-ext"
          :width="width" :height="extensionHeight - 36" :isFull="extensionFull"/>
      </transition>
    </keep-alive>
  </div>
  <div class="status" :style="{ bottom: extensionShowed && extensionFull ? '-28px' : '0px' }">
    <div class="left">
      <div class="text">{{ $t('editor.line-col', { line: row, col: column }) }}</div>
    </div>
    <div class="right">
      <button @click="toggleExtension()"><i class="icon-control"/></button>
    </div>
  </div>
  <div class="context-menu" ref="menus">
    <tm-menu :menu="menus.header" :show="menuShowed.header"/>
    <tm-menu :menu="menus.tab" :show="menuShowed.tab"/>
    <div>
      <div v-for="(menu, index) in menus.menubar">
        <tm-menu :menu="menu.content" :show="menuShowed.top[index]"/>
      </div>
    </div>
  </div>
</div>`)
}
