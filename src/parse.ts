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

function parse(rawSnippets: string): Array<Snippet> {
  let res = null;
  let snips: Array<Snippet> = [];
  while ((res = VIM_SNIPPET.exec(rawSnippets)) !== null) {
    const [_, prefix, description, body] = res;

    let snip = new Snippet();
    snip.prefix = prefix;
    snip.body = normalizePlaceholders(body)
    snip.descriptsion = description;

    Logger.debug("prefix: ", snip.prefix);
    Logger.debug("description: ", snip.descriptsion);
    Logger.debug("body: ", snip.body);
    lexParser(snip.body);
    snips.push(snip)
  }
  return snips;
}

function lexParser(str: string) {
  // 检查所有(``)包裹的部分, 并确保里面没有嵌套(`)
  const snipScript = new RegExp("(`\s*![^\`]*`)");
  Logger.info("Before parse", str);
  if (snipScript.test(str)) {
    let data = snipScript.exec(str) as RegExpExecArray;

    Logger.info(data);
    Logger.info(data[1]);
  }
  return str;
}

function normalizePlaceholders(str: string) {
  const visualPlaceholder = /\${(\d):\${VISUAL}}/;
  if (visualPlaceholder.test(str)) {
    let data = visualPlaceholder.exec(str) as RegExpExecArray;
    const n = data[1];
    Logger.info("Get visual data", data, n);
    return str.replace(visualPlaceholder, `$${n}`);
  } else {
    return str;
  }
}

export { parse };


// This is for unittest.

function main() {
  let TEST_CASE = [
    `snippet gitig "Git add will ignore this"
####### XXX: Can't GIT add [START] #########
$1
####### XXX: Can't GIT add  [END]  #########
endsnippet
`,
    `snippet ifmain "ifmain" b
if __name__ == \`!p snip.rv = get_quoting_style(snip)\`__main__\`!p snip.rv = get_quoting_style(snip)\`:
	\${1:\${VISUAL:main()}}
	\${2:\${VISUAL}}
endsnippet`
  ];
  TEST_CASE.forEach((txt: string) => {
    Logger.debug(parse(txt));
  });
}

if (require.main === module) {
  main();
}