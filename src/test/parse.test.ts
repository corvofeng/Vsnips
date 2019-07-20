import * as assert from "assert";
import * as ScriptFunc from "../script_tpl";
import { parse } from "../parse";

// suite("Parser Tests", function() {
//   test("Somethins 1", function() {
//     parse("hello world");
//   });
// });

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
    `snippet full_title "Python title fully"
#!/usr/bin/env python
# -*- coding: utf-8 -*-
# vim: ts=4 sw=4 tw=99 et:

"""
@Date   : \`!v strftime("%B %d, %Y")\`
@Author : \`!v g:snips_author\`

"""

endsnippet`,

    `snippet title "Hexo post header" b
---
layout: post
title: \`!p snip.rv = get_markdown_title(snip)\`
date: \`!v strftime("%Y-%m-%d %H:%M:%S")\`
author: \`!v g:snips_author\`
tags: 
description: ${3}
categories: Docs
photos:  
toc: true

---

${0}
endsnippet`
  ];

  let TEST_VAR_FILES = [
    '/home/corvo/.vim/common.vim',
  ];
  ScriptFunc.init_vim_var(TEST_VAR_FILES);

  TEST_CASE.forEach((txt: string) => {
    // Logger.debug(parse(txt));
    parse(txt);
  });
}

if (require.main === module) {
  main();
}