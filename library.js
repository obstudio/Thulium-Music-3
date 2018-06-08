global.library = {}
global.library.Languages = require('./languages/index.json')
global.library.LanguageSet = new Set(global.library.Languages.map((item) => item.key))
global.library.Themes = require('./themes/index.json')
global.library.LineEndings = [ 'LF', 'CRLF' ]

