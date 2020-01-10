import * as fs from "fs";
import * as path from "path";
import * as vscode from "vscode";
import { getSnipsDirs } from "./kv_store";
import { parse, Snippet } from "./parse";
import { Logger } from "./logger";

export {
  Snippet,
};

export class SnippetManager {
  /**
   * 记录某语言已经解析过的 Snippet
   */
  protected snippetsByLanguage = new Map<string, Snippet[]>();

  addLanguage(language: string) {
    if (!this.snippetsByLanguage.get(language)) {
      Logger.info("Repush the " + language + "from local dir");
      this.doAddLanguageType(language);
    } else {
      Logger.debug(language, "has been added");
    }
  }

  initDefaultLanguage() {
    this.addLanguage('all');
  }

  /**
   * 根据语言查询可用 snippets,
   * `all.snippets` 可以被所有语言使用
   */
  getSnippets(language: string) {
    const snippetsOfLanguage = this.snippetsByLanguage.get(language) || [];
    const snippetsOfAll = this.snippetsByLanguage.get('all') || [];
    return snippetsOfAll.concat(snippetsOfLanguage);
  }

  /**
   * 遍历 snips dirs 寻找对应语言的 snippets 文件并解析
   */
  protected doAddLanguageType(fileType: string) {
    const snippets: Snippet[] = [];
    const snippetFilePaths = getSnipsDirs().reduce((out: string[], snipDir) => {
      let snipFileNames = [`${fileType}.snippets`];
      for (let i = 0; i < snipFileNames.length; i++) {
        let snipFile = path.join(snipDir, snipFileNames[i]);
        Logger.info("Currently want search:", snipFile);
        if (!fs.existsSync(snipFile)) {
          Logger.warn(`The ${snipFile} not exists!!`);
          continue;
        }
        out.push(snipFile);
      }
      return out;
    }, []);

    snippetFilePaths.forEach(snipFile => {
      const fileContent = fs.readFileSync(snipFile, "utf8");

      // 如果 snippet中有extends语句, 根据 snippetsFilePath 查找同目录的 parent .snippets 文件
      const fileSnippets = parse(fileContent);
      snippets.push(...fileSnippets);
    });


    // Add the vdoc snippets for current file type, a little ugly.
    const vdocSnipContent = `snippet vdoc "${fileType} doc"\n` +
      `\`!p snip.rv = get_${fileType}_doc(snip)\`\n` +
      `endsnippet`;
    const vdocSnippet = parse(vdocSnipContent)[0];
    snippets.push(vdocSnippet);

    this.snippetsByLanguage.set(fileType, snippets);
  }
}

export const snippetManager = new SnippetManager();
