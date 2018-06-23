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
    menuData,
    menuKeys,

    onMount() {
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
        this.showMenuAtClient(event, style)
        this.menuData[key].show = true
      },
      showMenuAtClient(event, style) {
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
        this.showMenuAtButton(event, style)
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
        this.showMenuAtButton(event, style)
        this.menubarActive = true
        this.menuData.menubar.show = true
        this.menuData.menubar.embed.splice(index, 1, true)
      },
      showMenuAtButton(event, style) {
        console.log(event.currentTarget.offsetLeft,event.currentTarget.offsetWidth)
        if (event.currentTarget.offsetLeft + 200 > this.width) {
          style.left = event.currentTarget.offsetLeft + event.currentTarget.offsetWidth - 200 + 'px'
        } else {
          style.left = event.currentTarget.offsetLeft + 'px'
        }
        style.top = event.currentTarget.offsetTop + event.currentTarget.offsetHeight + 'px'
      }
    },

    TmMenus: {
      name: 'TmMenus',
      components: {
        TmMenu: {
          name: 'TmMenu',
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
          render: VueCompile(`<div class="content">
            <li v-for="(item, index) in data">
              <div v-if="item instanceof Object">
                <!--transition :name="move !== 0 ? 'tm-menu' : ''"
                  :leave-to-class="'transform-to-' + (move > 0 ? 'left' : move < 0 ? 'right' : 'none')"
                  :enter-class="'transform-to-' + (move > 0 ? 'right' : move < 0 ? 'left' : 'none')"-->
                  <tm-menu v-show="embed[index]" :data="item.content" :lists="lists"/>
                <!--/transition-->
              </div>
              <div v-else-if="item === '@separator'" class="menu-item disabled" @click.stop>
                <a class="separator"/>
              </div>
              <div v-else-if="getList(item)">
                <li v-for="li in getList(item).data" :key="li.id">
                  <div class="menu-item" @click="execute(getList(item).switch, li.id)">
                    <a class="label" :class="{ active: li.id === getList(item).current }">{{ li.title }}</a>
                    <span class="binding">
                      <i v-if="li.changed" class="icon-circle" @click.stop="execute(getList(item).close, li.id)"/>
                      <i v-else class="icon-close" @click.stop="execute(getList(item).close, li.id)"/>
                    </span>
                  </div>
                </li>
              </div>
              <div v-else-if="getContext(item)" class="menu-item disabled" @click.stop>
                <a class="label">{{ getCaption(item) }}</a>
                <span class="binding">{{ getBinding(item) }}</span>
              </div>
              <div v-else class="menu-item" @click="execute('executeCommand', item)">
                <a class="label">{{ getCaption(item) }}</a>
                <span class="binding">{{ getBinding(item) }}</span>
              </div>
            </li>
          </div>`)
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
      render: VueCompile(`<div class="tm-menus">
        <transition name="el-zoom-in-top" v-for="key in keys" :key="key">
          <ul v-show="data[key].show" class="tm-menu">
            <tm-menu :data="data[key].content" :embed="data[key].embed" :lists="lists"/>
          </ul>
        </transition>
      </div>`)
    }
  }
}
