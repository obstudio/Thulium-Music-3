// annoying bypass
const tempAmd = global.define.amd
global.define.amd = null
const draggable = require('vuedraggable')
global.define.amd = tempAmd

const SmoothScroll = require('../SmoothScroll')
const extensions = require('../../extensions/extension')
const { registerPlayCommand } = require('../../library/editor/Editor')

const storage = require('./storage')

const HalfTitleHeight = 34
const FullTitleHeight = 60
const StatusHeight = 28

module.exports = {
  name: 'TmEditor',

  components: {
    draggable
  },

  provide() {
    return {
      tabs: this.tabs,
      current: this.current,
      contextId: this.contextId,
      execute: this.executeMethod
    }
  },

  mixins: [
    require('../command')('editor')
  ],

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
    return {
      ...storageState,
      ...editorState,
      ...tabState,
      ...extensionState
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
      return `${this.width - 34}px`
    }
  },

  watch: {
    width() {
      this.layout(500)
      this.refreshAddTagLeft()
      this.adjustTabsScroll()
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
    current(newTab) {
      this.adjustTabsScroll()
    }
  },

  mounted() {
    // properties added in mounted hook to prevent unnecessary reactivity

    this.player = undefined
    this.tabs.forEach(tab => {
      tab.onModelChange((e) => {
        this.refresh(tab, e)
      })
      tab.checkChange()
    })
    this.doScroll = SmoothScroll(this.$refs.tabs.$el, { vertical: false })

    this.refreshExtUnderline()
    this.refreshAddTagLeft()
    this.adjustTabsScroll()
    this.showEditor()
    this.registerGlobalEvents()
    window.monaco.editor.setTheme(global.user.state.Settings.theme)
    this.activate()
    this.$nextTick(()=> {
      this.tabs.forEach(tab => {
        tab.node = this.$refs.tabs.$el.querySelector(`[identifier=tab-${tab.id}]`)
      })
    })
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
    layout(time = 0) {
      const now = performance.now(), self = this
      self.editor._configuration.observeReferenceElement()
      self.editor._view._actualRender()
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
        this.$refs.content.classList.add('no-transition')
        this.layout(500)
        this.$refs.content.classList.remove('no-transition')
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
    refreshAddTagLeft() {
      requestAnimationFrame(() => {
        const left = this.tabs.reduce((pre, cur, index) => {
          return pre + cur.node.clientWidth
        }, 0)
        this.addTagLeft = Math.min(this.width - 34, left)
      })
    },
    adjustTabsScroll() {
      requestAnimationFrame((p) => {
        const tabsNode = this.$refs.tabs.$el
        const left = this.current.node.offsetLeft
        const width = this.current.node.clientWidth
        const scroll = tabsNode.scrollLeft
        if (scroll < left + width - tabsNode.clientWidth) {
          this.doScroll(left + width - tabsNode.clientWidth - scroll + 20)
        } else if (scroll > left) {
          this.doScroll(left - scroll - 20)
        }
      })
    },

    // event handlers
    appendTabLeaveStyle(el) {
      if (el.nextElementSibling === null) {
        el.parentElement.animate({width: [`${this.width - el.clientWidth - 34}px`, `${this.width - 34}px`]}, 150)
      }
      el.style.left=`${el.offsetLeft-el.parentElement.scrollLeft}px`
      el.style.position = 'absolute'
    },
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
      this.hideContextMenus()
      this.draggingExtension = true
      this.draggingLastY = event.clientY
    },
    stopDrag() {
      this.draggingExtension = false
    },
    scrollTab(e) {
      this.doScroll(e.deltaY)
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
      <div v-for="(menu, index) in menuData.menubar.content" class="tm-top-menu"
        @click.stop="showMenu(index, $event)" @mouseover.stop="hoverMenu(index, $event)"
        :class="{ active: menuData.menubar.embed[index] }" @contextmenu.stop>
        {{ $t('editor.menu.' + menu.key) }} (<span>{{ menu.bind }}</span>)
      </div>
    </div>
    <div class="tm-tabs">
      <draggable :list="tabs" :options="dragOptions" @start="draggingTab = true" @end="draggingTab = false">
        <transition-group ref="tabs" name="tm-tabs" class="tm-scroll-tabs" :style="{width: tabsWidth}" :move-class="draggingTab ? 'no-transition' : ''" @wheel.prevent.stop.native="scrollTab" @beforeLeave="appendTabLeaveStyle">
        <button v-for="tab in tabs" @mousedown.left="switchTabById(tab.id)" @click.middle.prevent.stop="closeTab(tab.id)" :key="tab.id" :identifier="'tab-'+tab.id" class="tm-scroll-tab">
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
    :class="{ 'no-transition': draggingExtension }" :style="{ height: contentHeight }"/>
  <div class="extension" :class="{ 'no-transition': draggingExtension }" :style="{
      height: (extensionShowed && extensionFull ? '100%' : extensionHeight + 'px'),
      bottom: (extensionShowed ? extensionFull ? 0 : 28 : 28 - extensionHeight) + 'px'
    }">
    <div class="top-border" v-show="!extensionFull" @mousedown="startDrag"/>
    <div class="nav-left" ref="exts" @contextmenu.stop="showContextMenu('extension', $event)">
      <button v-for="(ext, index) in extensions" @click="changeExtension(index)"
        :key="ext.name" :class="{ active: activeExtension === index }">
        {{ getExtensionName(ext) }}
      </button>
    </div>
    <div class="underline" :style="{ left: extUnderlineLeft, width: extUnderlineWidth }"/>
    <div class="nav-right">
      <button @click="toggleFullExt()">
        <i :class="extensionFull ? 'icon-down' : 'icon-up'"/>
      </button>
      <button @click="extensionShowed = false">
        <i class="icon-close"/>
      </button>
    </div>
    <keep-alive>
      <transition name="tm-ext"
        :leave-to-class="'transform-to-' + (extensionMoveToRight ? 'left' : 'right')"
        :enter-class="'transform-to-' + (extensionMoveToRight ? 'right' : 'left')">
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
  <tm-menus ref="menus" :keys="menuKeys" :data="menuData" :lists="[{
    name: 'tabs',
    data: tabs,
    current: current.id,
    switch: 'switchTabById',
    close: 'closeTab'
  }]"/>
</div>`)
}
