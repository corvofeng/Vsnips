import { Logger } from "./logger";
import * as ScriptFunc from "./script_tpl";

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
    snips.push(snip);
  }
  return snips;
}

// 这部分代码用于实现从vim 或是 python函数 => js函数的转换
// 主要应用了正则替换.
function lexParser(str: string) {
  // 检查所有(``)包裹的部分, 并确保里面没有嵌套(`)
  const snipScript = /`([^\`]*)`/g;
  // const innerStmt = /\`(.*)\`/;

  const FT_UNKNOW= 0x0;
  const FT_VIM = 0x1;
  const FT_PYTHON = 0x2;
  const FT_JAVASCRIPT = 0x3;

  Logger.info("Before parse", str);
  let stmt = null;
  while ((stmt = snipScript.exec(str)) !== null) {
    Logger.debug("Get parser", stmt);
    let func_type = FT_PYTHON;
    if (stmt[1].startsWith('!p')) {
      func_type = FT_PYTHON;
    } else if (stmt[1].startsWith('!v')) {
      func_type = FT_VIM;
    } else if (stmt[1].startsWith('!js')) {
      func_type = FT_JAVASCRIPT;
    }else {
      func_type = FT_UNKNOW;
    }

    let rlt = '';
    switch (func_type) {
      case FT_PYTHON:
        pythonRewrite(stmt[1]);
        break;

      case FT_VIM:
        break;
    
      case FT_JAVASCRIPT:
        break;

      default:
        break;
    }

    // data.forEach((stmt) => {
    //   let data = innerStmt.exec(stmt) as RegExpExecArray;
    //   Logger.info("Get visual data", data);
    // })

    Logger.info(stmt);
  }

  return str;
}

function pythonRewrite(stmt: string) {
  // 用于处理这一类字符串: `!p snip.rv = get_quoting_style(snip)`
  Logger.info("Wanna rewrite", stmt);
  Logger.info("Get quota style: ", ScriptFunc['get_quoting_style']());

  return stmt;
}

function vimRewrite(stmt: string) {
  // 用于处理这一类字符串: `!v g:snips_author`

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
    // simple snippets
    `snippet gitig "Git add will ignore this"
####### XXX: Can't GIT add [START] #########
$1
####### XXX: Can't GIT add  [END]  #########
endsnippet
`,
    // snippets with python
    `snippet ifmain "ifmain" b
if __name__ == \`!p snip.rv = get_quoting_style(snip)\`__main__\`!p snip.rv = get_quoting_style(snip)\`:
	\${1:\${VISUAL:main()}}
	\${2:\${VISUAL}}
endsnippet`,

    // snippets with vim script
//     `snippet full_title "Python title fully"
// #!/usr/bin/env python
// # -*- coding: utf-8 -*-
// # vim: ts=4 sw=4 tw=99 et:

// """
// @Date   : \`!v strftime("%B %d, %Y")\`
// @Author : \`!v g:snips_author\`

// """

// endsnippet
// `,

  ];
  TEST_CASE.forEach((txt: string) => {
    // Logger.debug(parse(txt));
    parse(txt);
  });
}

if (require.main === module) {
  main();
}