const keymap = require('./keymap.json')
const Mousetrap = require('mousetrap')

// TODO: improve this pattern maybe. 
// Cause: firing event inside textarea is blocked by mousetrap by default.
Mousetrap.prototype.stopCallback = () => false

const commands = {}

function toKebab(camel) {
  return camel.replace(/[A-Z]/g, char => '-' + char.toLowerCase())
}

for (const command of require('./command.json')) {
  const key = command.key ? command.key : toKebab(command.method)
  if (command.caption && !(command.caption instanceof Array)) {
    command.caption = [command.caption]
  }
  commands[key] = command
}

module.exports = {
  keymap,
  commands,
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
  onMount() {
    for (const key in keymap) {
      if (!(key in commands) || keymap[key].startsWith('!')) continue
      Mousetrap.bind(keymap[key], () => {
        this.executeCommand(key)
        return false
      })
    }
  }
}