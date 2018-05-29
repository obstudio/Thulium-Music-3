const yaml = require('js-yaml')
const fs = require('fs')
const path = require('path')

function build(map) {
  for (const item of map) {
    for (const file of item.files) {
      fs.writeFileSync(
        __dirname + '/../' + item.to + file + '.json',
        JSON.stringify(yaml.safeLoad(fs.readFileSync(
          __dirname + '/' + item.from + file + '.' + item.extension,
          {encoding: 'utf8'}
        ))),
        {encoding: 'utf8'}
      )
    }
  }
}

build([
  {
    from: 'syntax/',
    to: 'library/editor/',
    extension: 'yaml',
    files: [ 'tm' ]
  },
  {
    from: 'themes/',
    to: 'themes/',
    extension: 'yaml',
    files: [ 'dark' ]
  }
])
