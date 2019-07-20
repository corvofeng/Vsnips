
import * as fs from 'fs';
import * as path from 'path';
import { Logger } from "./logger";
import { parse } from './parse';
import * as vscode from "vscode";
import { VSnipContext } from './vsnip_context';

let search_dirs = [
  '/home/corvo/.vim/UltiSnips',
  // '/home/corvo/.vim/plugged/vim-snippets/UltiSnips',
];

function ultisnipsToJSON(ultisnips: string) {
  const snippets = parse(ultisnips);
  Logger.debug(snippets);
  return snippets;
}

async function generate(context: vscode.ExtensionContext) {
  search_dirs.forEach(async (dirname) => {
    fs.readdir(dirname, function (err, files) {
      if (err) {
        Logger.error(err);
        return;
      }
      files.forEach(async (file, index) => {
        Logger.info("In snippets ", file);

        let res = /([^\s]*)\.snippets$/.exec(file);
        if (res === null) {
          Logger.warn("Can't parse ", file)
          return;
        }

        const [_, file_type] = res;
        let f_name = path.join(dirname, file);
        let sel: vscode.DocumentFilter;
        if (file_type === 'all') {
          sel = { scheme: 'file' };
        } else {
          sel = { scheme: 'file', language: file_type };
        }

        // if (file != 'python.snippets') return;
        const data = fs.readFileSync(f_name, 'utf8');
        let snippets = await ultisnipsToJSON(data);

        let item = vscode.languages.registerCompletionItemProvider(
          sel,  // 指定代码语言
          {
            provideCompletionItems(document, position, token, context) {
              Logger.debug("Get completion item", document, position, token, context);
              let compleItems: Array<vscode.CompletionItem> = [];
              let vSnipContext = new VSnipContext(document, position, token, context);
              snippets.forEach((snip) => {
                const snippetCompletion = new vscode.CompletionItem(snip.prefix);
                snippetCompletion.documentation = snip.descriptsion + '\n' + snip.body;
                snippetCompletion.label = `Vsnips-${snip.prefix}: ${snip.descriptsion}`;
                snippetCompletion.insertText = new vscode.SnippetString(
                  snip.get_snip_body(vSnipContext)
                );
                compleItems.push(snippetCompletion);
              });
              return compleItems;
            }
          },
          "V", "v",
        );
        await context.subscriptions.push(item);
        // completItems.push(item);
        // completItems.forEach((item) => {
        //   context.subscriptions.push(item);
        // });
      });

    });

  });
}
export { generate };
