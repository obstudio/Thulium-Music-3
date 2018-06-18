const fs = require('fs');
const path = require('path');
const Parser = require('./parser/Parser');
const Tokenizer = require('./token/Tokenizer');
const Linter = require('./linter/Linter');
const Adapter = require('./adapter/Adapter')

const packagePath = __dirname + '/../packages';
const packageInfo = require(packagePath + '/index.json');
const library = { Path: packagePath, ...packageInfo };

class Thulium {
  constructor(input, { useFile = true, loadBuffer = false, saveBuffer = false } = {}) {
    if (useFile) {
      var directory = path.dirname(input);
      if (fs.existsSync(input)) {
        input = fs.readFileSync(input, 'utf8');
      } else {
        input = '';
        throw new Error()
      }
    }

    function loadFile(filename) {
      if (fs.existsSync(filename + '.tml')) {
        const content = fs.readFileSync(filename + '.tml', {encoding: 'utf8'});
        return new Tokenizer(content, {
          loadFile: loadFile,
          $library: library,
          $directory: path.dirname(filename)
        }).initialize();
      } else if (fs.existsSync(filename)) {
        if (loadBuffer && fs.existsSync(filename + '/buffer.json')) {
          return require(filename + '/buffer.json');
        } else if (fs.existsSync(filename + '/main.tml')) {
          const content = fs.readFileSync(filename + '/main.tml', {encoding: 'utf8'});
          const data = new Tokenizer(content, {
            loadFile: loadFile,
            $library: library,
            $directory: filename
          }).initialize();
          if (saveBuffer) {
            fs.writeFileSync(filename + '/buffer.json', JSON.stringify(data), {encoding: 'utf8'});
          }
          return data;
        } else {
          throw new Error(`File "${filename}/main.tml" was not found!`);
        }
      } else {
        throw new Error(`File "${filename}.tml" was not found!`);
      }
    }

    const tokenizer = new Tokenizer(input, {
      loadFile: loadFile,
      $library: library,
      $directory: directory
    });
    tokenizer.tokenize();
    Object.assign(this, tokenizer);
    this.$parse = false;
  }

  parse(forced = false) {
    if (this.$parse && !forced) return this.MusicClips; 
    this.MusicClips = new Parser(this).parse();
    this.$parse = true;
    return this.MusicClips;
  }

  adapt(spec = undefined, form = 'MIDI') {
    return new Adapter(this.parse(), spec).adapt(form)
  }

  detokenize() {
    return new Linter(this.Tokenizer, this.Syntax).detokenize();
  }

  matchScope(name, position) {
    return this.Scoping[name].some(scope => scope.start < position && scope.end >= position)
  }

  attributes(...attrs) {
    const result = {};
    attrs.forEach(attr => result[attr] = this[attr]);
    return result;
  }

  get Tokenizer() {
    return this.attributes('Comment', 'Library', 'Sections', 'Warnings', 'Index');
  }

  get information() {
    const clips = this.parse(true);
    const comment = this.Comment.map(line => {
      const result = [];
      line = line.trim();
      for (let i = 0; i < line.length; i++) {
        result.push(line.charCodeAt(i));
      }
      return result;
    });
    return {
      Status: 'Succeed',
      Comment: comment,
      Sections: this.Sections,
      Warnings: this.Warnings,
      MusicClips: clips
    }
  }
}

Thulium.$library = library;
Thulium.$remote = function(source) {
  const thulium = new Thulium('', {useFile: false})
  return Object.assign(thulium, source)
}

module.exports = Thulium;

