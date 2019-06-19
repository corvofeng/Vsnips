import { Logger } from "./logger";

const VIM_SNIPPET = /^snippet ([^\s]*)\s*(?:"(.*?)".*)?\n((?:.|\n)*?)\nendsnippet$/gm;

class Snippet {
  prefix: string;
  body: string;
  descriptsion: string;

  constructor() {
    this.prefix = '';
    this.body = '';
    this.descriptsion = '';
  }
}

function parse(rawSnippets: string):  Array<Snippet> {
  let res = null;
  Logger.debug(rawSnippets);
  let snips: Array<Snippet> = [];
  while ((res = VIM_SNIPPET.exec(rawSnippets)) !== null) {
    //eslint-disable-next-line no-unused-vars
    const [_, prefix, description, body] = res;
    Logger.debug("prefix: ", prefix);
    Logger.debug("description: ", description);
    Logger.debug("body: ", normalizePlaceholders(body));
    // Logger.debug("body after normalize: ", normalizePlaceholders(body));

    let snip = new Snippet();
    snip.prefix  = prefix;
    snip.body = normalizePlaceholders(body)
    snip.descriptsion = description;
    snips.push(snip)
  }
  return snips;
}

function normalizePlaceholders(str: string) {
  const visualPlaceholder = /\${(\d):\${VISUAL}}/;
  if (visualPlaceholder.test(str)) {
    let data = visualPlaceholder.exec(str) as RegExpExecArray;
    const n = data[1];
    return str.replace(visualPlaceholder, `$${n}`);
  } else {
    return str;
  }
}

// module.exports = {
//   parse
// };
export { parse };
(function main() {
  let txt = `snippet gitig "Git add will ignore this"
####### XXX: Can't GIT add [START] #########
$1
####### XXX: Can't GIT add  [END]  #########
endsnippet
`;
  Logger.debug(parse(txt));
})();
