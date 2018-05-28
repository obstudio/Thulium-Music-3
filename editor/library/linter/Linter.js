class TmLinter {
  constructor(tokenizer, syntax) {
    this.Syntax = syntax;
    this.Source = tokenizer;
    this.Comment = '';
    this.Library = '';
    this.Sections = [];
    this.$detok = false;
  }

  static oneLine(command) {
    const linearTypes = ['include', 'end'];
    return linearTypes.includes(command.Type);
  }

  detokenize() {
    // Comment
    for (const comment of this.Source.Comment) {
      this.Comment += '//' + comment + '\n';
    }
    if (this.Source.Comment.length > 0) this.Comment += '\n';

    // Library
    for (const command of this.Source.Library) {
      if (command.Head) this.Library += command.Head + '\n\n';
      if (!TmLinter.oneLine(command)) {
        this.Library += command.Code.join('\n');
      }
    }

    // Sections
    for (const section of this.Source.Sections) {
      let result = '';
      for (const comment of section.Comment) {
        result += '//' + comment + '\n';
      }
      if (section.Comment.length === 0 && this.Source.Sections.indexOf(section) !== 0) {
        result += '\n';
      }
      if (section.Prolog.length > 0) {
        result += this.detokContent(section.Prolog) + '\n\n';
      }
      for (const track of section.Tracks) {
        if (track.Instruments.length || track.Name) {
          result += '<'
          if (!track.Play) result += ':'
          if (track.Name) result += track.Name + ':'
          result += track.Instruments.map(inst => {
            let result = inst.Space + inst.Name
            inst.Dict.forEach(decl => {
              if (decl.Generated) {
                return
              } else {
                result += '[' + decl.Name
                if (decl.Pitches) {
                  result += '=' + decl.Pitches.map(TmLinter.detokPitch).join('')
                }
                result += ']'
              }
            });
            result += this.detokContent(inst.Spec)
            return result
          }).join(',')
          result += '>'
        }
        result += this.detokContent(track.Content) + '\n\n';
      }
      if (section.Epilog.length > 0) {
        result += this.detokContent(section.Epilog) + '\n\n';
      }
      result = result.slice(0, -1);
      this.Sections.push(result);
    }

    this.$detok = true;
    return this.Comment + this.Library + this.Sections.join('\n');
  }

  detokContent(content) {
    let result = '';
    for (const token of content) {
      switch (token.Type) {
      case 'Space':
        result += token.Content;
        break;
      case 'Function': 
        if (token.Alias === -1) {
          result += `${token.Name}(${this.detokArgs(token.Args)})`;
        } else if (token.Alias === 0) {
          result += `(${token.Name}:${this.detokArgs(token.Args)})`;
        } else {
          const alias = this.Syntax.Alias.find(alias => alias.Name === token.Name);
          if (alias.LeftId !== undefined) {
            result += this.detokContent(token.Args[alias.LeftId].Content);
          }
          for (const sub of alias.Syntax) {
            if (sub.Type === '@lit') {
              result += sub.Content;
            } else {
              result += token.Args[sub.Id].Origin;
            }
          }
          if (alias.RightId !== undefined) {
            result += this.detokContent(token.Args[alias.RightId].Content);
          }
        }
        break;
      case 'Note':
        result += TmLinter.detokNote(token);
        break;
      case 'Subtrack':
        result += '{';
        if (token.Repeat < -1) result += `${-token.Repeat}*`;
        result += this.detokContent(token.Content);
        result += '}';
        break;
      case 'Macrotrack':
        result += '@' + token.Name;
        break;
      case 'BarLine':
        if (token.Skip) {
          result += '\\';
        } else if (token.Overlay) {
          result += '/';
        } else if (token.Order.includes(0)) {
          result += '|';
        } else {
          const order = token.Order.sort((x, y) => x - y);
          result += '\\';
          let i = 0;
          while (i < order.length) {
            let j = i + 1;
            while (j < order.length && order[j] === order[j - 1] + 1) j += 1;
            if (j === i + 1) {
              result += `${order[i]},`;
            } else if (j === i + 2) {
              result += `${order[i]},${order[i] + 1},`;
            } else {
              result += `${order[i]}~${order[j - 1]},`
            }
            i = j;
          }
          if (i) result = result.slice(0, -1);
          result += ':';
        }
        break;
      default:
        result += '[' + token.Type + ']';
        break;
      }
    }
    return result;
  }

  detokArgs(args) {
    let result = '';
    for (const arg of args) {
      switch (arg.Type) {
      case 'String':
        result += '"' + arg.Content + '"';
        break;
      case 'Expression':
        result += arg.Content;
        break;
      case 'Subtrack':
        result += '{' + arg.Content + '}';
        break;
      case 'Macrotrack':
        result += '@' + arg.Name;
        break;
      case 'Function':
        result += `${arg.Content.Name}(${this.detokArgs(arg.Content.Args)})`;
        break;
      }
      result += ',';
    }
    if (args.length > 0) result = result.slice(0, -1)
    return result;
  }

  static detokPitch(pitch) {
    return pitch.Pitch + pitch.PitOp + pitch.Chord + pitch.VolOp;
  }

  static detokNote(note){
    let result = '';
    if (note.Pitch.length > 1) {
      result += '[' + note.Pitch.map(TmLinter.detokPitch).join('') + ']';
    } else {
      result += TmLinter.detokPitch(note.Pitch[0]);
    }
    result += note.PitOp + note.Chord + note.VolOp + note.DurOp + '`'.repeat(note.Stac);
    return result;
  }
}

module.exports = TmLinter;
