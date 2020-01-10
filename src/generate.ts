import * as vscode from "vscode";
import { Logger } from "./logger";
import { parse, Snippet } from "./parse";
import { VSnipContext } from "./vsnip_context";
import { longestMatchCharsFromStart } from './util';
import { snippetManager } from './snippet_manager';

// function ultisnipsToJSON(ultisnips: string) {
//   const snippets = parse(ultisnips);
//   Logger.debug(snippets);
//   return snippets;
// }

export function generate(context: vscode.ExtensionContext) {
  snippetManager.initDefaultLanguage();

  // Trigger snippet on every reasonable ascii character.
  const triggers: string[] = [];
  for (let i = 32; i <= 126; i++) {
    triggers.push(String.fromCharCode(i));
  }

  // 如果从一开始就解析所有的snippet文件, 势必会造成vscode启动卡顿的问题
  // 这里采取一种替换方案, 当用户真正触发补全操作时, 才会解析对应的snippets文件,
  // 将解析放在了用户第一次触发的阶段.

  // 注册 completionItemProiver
  const provider = vscode.languages.registerCompletionItemProvider(
    { scheme: "file" },
    {
      provideCompletionItems(document, position, token, context) {
        Logger.debug("Get completion item", document, position);

        // 用户触发了补全事件, 此时依照文件类型, 查找对应的snippets文件
        snippetManager.addLanguage(document.languageId);
        const snippets = snippetManager.getSnippets(document.languageId);
        if (!snippets.length) {
          return [];
        }

        const prevContentInLine = document.getText(new vscode.Range(position.line, 0, position.line, position.character));

        // Checks if the cursor is at a word, if so the word is our context, otherwise grab
        // everything until previous whitespace, and that is our contextWord.
        let range = document.getWordRangeAtPosition(position);
        if (!range) {
          let match = prevContentInLine.match(/\S*$/);
          const charPos = (match as RegExpMatchArray).index || 0;
          range = new vscode.Range(position.line, charPos, position.line, position.character);
        }
        const contextWord = document.getText(range);

        // 前两个字符是 vs 的话就列出所有 snippets
        const shouldAddAll = longestMatchCharsFromStart('vsnips', contextWord.toLowerCase()).length >= 2;

        let compleItems: Array<vscode.CompletionItem> = [];
        snippets.forEach(snip => {
          let shouldAdd = shouldAddAll;
          if (!shouldAdd) {
            // MAYBE: 如果有 fuzzy search 会更好
            if (snip.prefix.startsWith(contextWord)) {
              shouldAdd = true;
            }
          }
          if (!shouldAdd) {
            return;
          }
          const completionItem = new vscode.CompletionItem(snip.prefix, vscode.CompletionItemKind.Snippet);
          completionItem.detail = `Vsnips-${snip.prefix}: ${ snip.descriptsion }`;
          completionItem.filterText = completionItem.detail;
          completionItem.sortText = completionItem.detail;
          completionItem.documentation = snip.descriptsion + "\n" + snip.body;
          const payload: ExpandSnippetCommandPayload = {
            snippet: snip,
            document,
            position,
            token,
            context,
          };
          // 调用 command 的时候才真正展开 snippet body
          completionItem.command = {
            command: 'Vsnips.expand',
            title: 'expand',
            arguments: [payload]
          };
          compleItems.push(completionItem);
        });
        return compleItems;
      }
    },
    ...triggers
  );
  context.subscriptions.push(provider);

  Logger.info("Register vsnips success!!");
}

export type ExpandSnippetCommandPayload = {
  snippet: Snippet
  document: vscode.TextDocument
  position: vscode.Position
  token?: vscode.CancellationToken
  context?: vscode.CompletionContext
};

/**
 * 会被 'Vsnips.expand' command 调用
 */
export function expandSnippet(editor: vscode.TextEditor, payload: ExpandSnippetCommandPayload) {
  const { snippet, document, position, token, context } = payload;
  const vSnipContext = new VSnipContext(
    document,
    position,
    token,
    context
  );
  const vsSnippet = new vscode.SnippetString(snippet.get_snip_body(vSnipContext));
  const contextWordRange = document.getWordRangeAtPosition(position);
  editor.insertSnippet(vsSnippet, contextWordRange, { undoStopBefore: false, undoStopAfter: false });
}
