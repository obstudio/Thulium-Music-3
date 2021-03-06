const Mousetrap = require('mousetrap')

// TODO: improve this pattern maybe. 
// Cause: firing event inside textarea is blocked by mousetrap by default.
Mousetrap.prototype.stopCallback = () => false

function toKebab(camel) {
  return camel.replace(/[A-Z]/g, char => '-' + char.toLowerCase())
}

module.exports = function(context) {
  const commandData = require(`./${context}/command.json`) || []
  const keymap = require(`./${context}/keymap.json`) || {}
  const menus = require(`./${context}/menu.json`) || {}

  const commands = {}
  for (const command of commandData) {
    const key = command.key ? command.key : toKebab(command.method)
    if (command.caption && !(command.caption instanceof Array)) {
      command.caption = [command.caption]
    }
    commands[key] = command
  }

  const menuData = {}
  const menuKeys = Object.keys(menus)
  for (const key of menuKeys) {
    menuData[key] = {
      show: false,
      content: menus[key],
      embed: new Array(menus[key].length).fill(false)
    }
  }

  return {
    data() {
      return {
        menuData,
        menuKeys,
        menubarMove: 0,
        menubarActive: false,
        altKey: false,
        contextId: null
      }
    },

    mounted() {
      for (const key in keymap) {
        if (!(key in commands) || keymap[key].startsWith('!')) continue
        Mousetrap.bind(keymap[key], () => {
          this.executeCommand(key)
          return false
        })
      }
      this.menuReference = {}
      for (let index = 0; index < menuKeys.length; index++) {
        this.menuReference[menuKeys[index]] = this.$refs.menus.$el.children[index]
      }
    },

    methods: {
      executeMethod(method, ...args) {
        if (method in this) this[method](...args)
      },
      executeCommand(key) {
        if (commands[key].method in this) {
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
        } else {
          this.$message.error(`No command ${key} was found!`)
        }
      },
      hideContextMenus() {
        this.menubarActive = false
        for (const key in this.menuData) {
          this.menuData[key].show = false
          for (let index = 0; index < this.menuData[key].embed.length; index++) {
            this.menuData[key].embed.splice(index, 1, false)
          }
        }
      },
      showContextMenu(key, event) {
        const style = this.menuReference[key].style
        this.hideContextMenus()
        this.locateMenuAtClient(event, style)
        this.menuData[key].show = true
      },
      locateMenuAtClient(event, style) {
        if (event.clientX + 200 > this.width) {
          style.left = event.clientX - 200 - this.left + 'px'
        } else {
          style.left = event.clientX - this.left + 'px'
        }
        if (event.clientY - this.top > this.height / 2) {
          style.top = ''
          style.bottom = this.top + this.height - event.clientY + 'px'
        } else {
          style.top = event.clientY - this.top + 'px'
          style.bottom = ''
        }
      },
      hoverMenu(index, event) {
        if (this.menubarActive && !this.menuData.menubar.embed[index]) {
          this.showMenu(index, event)
        }
      },
      showButtonMenu(key, event) {
        const style = this.menuReference[key].style
        this.hideContextMenus()
        this.locateMenuAtButton(event, style)
        this.menuData[key].show = true
      },
      showMenu(index, event) {
        this.contextId = null
        const style = this.menuReference.menubar.style
        const last = this.menuData.menubar.embed.indexOf(true)
        if (last === index) {
          this.menubarActive = false
          this.menuData.menubar.show = false
          this.menuData.menubar.embed.splice(index, 1, false)
          return
        } else if (last === -1) {
          this.menubarMove = 0
        } else {
          this.menubarMove = index - last
        }
        this.hideContextMenus()
        this.locateMenuAtButton(event, style)
        this.menubarActive = true
        this.menuData.menubar.show = true
        this.menuData.menubar.embed.splice(index, 1, true)
      },
      locateMenuAtButton(event, style) {
        const rect = event.currentTarget.getBoundingClientRect()
        if (rect.left + 200 > this.width) {
          style.left = rect.left + rect.width - 200 - this.left + 'px'
        } else {
          style.left = rect.left - this.left + 'px'
        }
        style.top = rect.top + rect.height - this.top + 'px'
      }
    },

    components: {
      TmMenus: {
        name: 'TmMenus',
        components: {
          TmMenu: {
            name: 'TmMenu',
            components: {
              TmMenuList: {
                name: 'TmMenuList',
                props: {
                  list: {
                    type: Object,
                    required: true
                  }
                },    
                inject: ['execute'],
                render: getRender(__dirname + '/tm-menu-list.html')
              }
            },
            methods: {
              getBinding(key) {
                let binding = keymap[key]
                if (!binding) return ''
                if (binding.charAt(0) === '!') binding = binding.slice(1)
                return binding.replace(/[a-z]+/g, word => {
                  return word.charAt(0).toUpperCase() + word.slice(1)
                }).replace(/ /g, ', ')
              },
              getCaption(key) {
                if (commands[key].caption) {
                  let pointer
                  for (pointer = 0; pointer < commands[key].caption.length; pointer++) {
                    if (this.getValue(commands[key].caption[pointer])) break
                  }
                  return this.$t(`${context}.menu.${key}.${pointer}`)
                } else {
                  return this.$t(`${context}.menu.${key}`)
                }
              },
              getContext(key) {
                if (commands[key].enabled) {
                  return !this.getValue(commands[key].enabled)
                } else {
                  return false
                }
              },
              getValue(data) {
                // FIXME: optimize value pattern
                return this.$parent[data.slice(1)]
              },
              getList(name) {
                if (!name.startsWith('@')) return false
                return this.lists.find(item => item.name === name.slice(1))
              }
            },
            inject: ['execute'],
            props: {
              data: {
                type: Array,
                required: true
              },
              move: { // no use
                type: Number,
                default() {
                  return 0
                }
              },
              embed: {
                type: Array,
                default() {
                  return []
                }
              },
              lists: {
                type: Array,
                default() {
                  return []
                }
              }
            },
            render: getRender(__dirname + '/tm-menu.html')
          }
        },
        props: {
          keys: {
            type: Array,
            required: true
          },
          data: {
            type: Object,
            required: true
          },
          lists: {
            type: Array,
            default() {
              return []
            }
          }
        },
        render: getRender(__dirname + '/tm-menus.html')
      }
    }
  }
}
