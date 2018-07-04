// annoying bypass
const tempAmd = global.define.amd
global.define.amd = null
const draggable = require('vuedraggable')
global.define.amd = tempAmd

const SmoothScroll = require('../SmoothScroll')
const extensions = require('../../extensions/extension')
const { registerPlayCommand } = require('../../library/editor/Editor')

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
    require('../command')('editor'),
    require('./storage')
  ],

  data() {
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
      ...editorState,
      ...tabState,
      ...extensionState
    }
  },

  computed: {
    contentHeight() {
      return this.remainHeight - (this.extensionShowed ? this.extensionHeight : 0) + 'px'
    },
    remainHeight() {
      return this.height - StatusHeight - (this.menubar ? FullTitleHeight : HalfTitleHeight)
    },
    settings() {
      return this.$store.state.Settings
    },
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
    current(newTab) {
      this.adjustTabsScroll()
    }
  },

  mounted() {
    // properties added in mounted hook to prevent unnecessary reactivity
    this.player = undefined
    this.tabs.forEach(tab => {
      tab.onModelChange(event => this.refresh(tab, event))
      tab.checkChange()
    })
    this.doScroll = SmoothScroll(this.$refs.tabs.$el, { vertical: false })

    this.refreshExtUnderline()
    this.refreshAddTagLeft()
    this.adjustTabsScroll()
    this.showEditor()
    this.registerGlobalEvents()
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
      window.monaco.editor.setTheme(this.$store.state.Settings.theme)
      this.editor.setModel(this.current.model)
      if (this.current.viewState) this.editor.restoreViewState(this.current.viewState)
      const position = this.editor.getPosition()
      this.row = position.lineNumber
      this.column = position.column
      this.$store.state.Prefix.editor = this.current.title + ' - '
      this.layout()
    },
    refresh(tab, event) {
      if (event) tab.latestVersionId = event.versionId
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
      this.$watch('settings.minimap', function() {
        this.editor.updateOptions({
          minimap: { enabled: this.settings.minimap }
        })
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
          this.doScroll.scrollByDelta(left + width - tabsNode.clientWidth - scroll + 20)
        } else if (scroll > left) {
          this.doScroll.scrollByDelta(left - scroll - 20)
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
      this.doScroll.scrollByDelta(e.deltaY)
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
      if (this.$store.state.Settings.language in ext.i18n) {
        return ext.i18n[this.$store.state.Settings.language]
      } else {
        return ext.i18n.default
      }
    }
  },

  props: ['width', 'height', 'left', 'top'],
  render: getRender(__dirname + '/editor.html')
}
