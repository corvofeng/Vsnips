# Vsnips

[![.github/workflows/ci.yml](https://github.com/corvofeng/Vsnips/actions/workflows/ci.yml/badge.svg)](https://github.com/corvofeng/Vsnips/actions/workflows/ci.yml)

Click here to install Vsnips:

[![](./images/download.png)](https://corvo.myseu.cn/vscode/corvofeng.Vsnips)

OR

```
ext install corvofeng.Vsnips
```

> (news)2022-04-12, we support vscode web extension, and you can install it when you use `vscode.dev` or `github.dev`.


![](./images/vimeo.png)
<div>Icons made by <a href="https://www.freepik.com" title="Freepik">Freepik</a> from <a href="https://www.flaticon.com/" title="Flaticon">www.flaticon.com</a></div>

Please: refer to the docs: [https://vsnips.corvo.fun/](https://vsnips.corvo.fun/zh/intro/)

* [中文文档](https://vsnips.corvo.fun/zh/intro/)

<!-- * [国内访问文档, 七牛cdn加速](https://vsnips.rawforcorvofeng.cn/) -->

Allows you to use Ultisnips in vscode.

> It is under development, although I can't guarantee that
> all ultisnips functions can be used in vscode, I will try my best.
> Please feel free to give an issue or pull requests.

![Vsnips][7]

## UltiSnips

For details of Ultisnips, please refer [here][1].

![ultisnips][2].

It's easy to write an UltiSnips snippets, for example, in `Python`,
I usually use `import IPython; IPython.embed()` for debugging.
And you could write snippts like this:

`python.snippets`

```snippets
snippet dbg "Use IPython to debug"
# ---------- XXX: Can't GIT add [START] ---------- #
import IPython
IPython.embed(using=False)
# ---------- XXX: Can't GIT add  [END]  ---------- #
endsnippet
```

The whole snippst is surrounded with `snippet` and `endsnippet`,
while the `dbg` is the triger, and `"Use IPython to debug"` is
description for this snippet. This is what it looks like when you use the snippet:

![3][3]

## VScode snippets

VScode has it's own implementation for [snippets][4] which lets you create your own. But I found it difficult to use and lacking in feature set, for example:

1. If there is a multi-line snippet, `json` is not very well for storing.
2. It's hard for many PC sync the snippets. Because of this, there is already too many snippet extensions for different languages, like, [C/C++ Snippets][5], [Bootstrap 3 Snippets][6].

I do not mean that it's bad for different language having their own extension.
But you must admit that if you want to  add snippets for a language,
you need to learn how to write an extension and how to add snippets.
and what's most important is that if you are an vimmer, you had to
write snippets for these two editors, which bothers me.


## How to use Vsnips

> This plugin based on the [snippet api][8] in VScode, whether
> you have used UltiSnips or not, it's easy to start.
> I have adapted some UltiSnips snippets to VScode and used it by default.

If you have already use UltiSnips, and even have your own snippets,
you can add own snippets dir in settings, and use the variable in `VarFiles`
to set that.

```json
{
    "Vsnips.VarFiles": [
        "/home/corvo/.vimrc",
        "/home/corvo/.vim/common.vim",
    ],
    "Vsnips.SnipsDir": [
        "/home/corvo/.vim/UltiSnips"
    ]
}
```

When you give the variable like `let g:snips_author="corvo"`, you could
use it like snippets below.

```snippets
snippet full_title "Python title fully"
#!/usr/bin/env python
# -*- coding: utf-8 -*-
# vim: ts=4 sw=4 tw=99 et:

"""
@Date   : `!v strftime("%B %d, %Y")`
@Author : `!v g:snips_author`

"""

endsnippet
```

## Completed Tasks

- [x] Auto download the Ultisnips
- [x] Multi language completions support
- [x] Allow user add their own Ultisnips.
    - [x] From Ultisnips to VScode snippets.
    - [x] Support strftime
    - [x] Allow user define variables
    - [x] Allow some functions(Rewrite by javascript)
- [x] Syntax highlight for snippets
- [x] Allow user define their own functions
- [x] Support autoDocstring for Python and TypeScript.
- [x] Add support for golang function comments.

## Work in Progress

- [ ] Support extends and priority in Ultisnips

### May not work

The UltiSnips in vim could adjust the doc according to the
python function argument. But the Vsnips is based on VScode
`CompletionItemProvider`, it may be hard to support this feature.

So, I change to another solution, after the user triggers the keys like `v-doc`,
Vsnips could auto-generate the doc for the functions,
Which will refer to [autoDocstring][9].


[1]: https://github.com/SirVer/ultisnips
[2]: https://raw.github.com/SirVer/ultisnips/master/doc/demo.gif
[3]: https://user-images.githubusercontent.com/12025071/62412148-14cad280-b631-11e9-8d9c-01a65a2550ef.gif
[4]: https://code.visualstudio.com/docs/editor/userdefinedsnippets#_creating-your-own-snippets
[5]: https://marketplace.visualstudio.com/items?itemName=hars.CppSnippets
[6]: https://marketplace.visualstudio.com/items?itemName=wcwhitehead.bootstrap-3-snippets
[7]: https://user-images.githubusercontent.com/12025071/62412552-19928500-b637-11e9-8335-dfe3f0ca0688.gif
[8]: https://code.visualstudio.com/api/references/vscode-api#CompletionItemProvider
[9]: https://marketplace.visualstudio.com/items?itemName=njpwerner.autodocstring
