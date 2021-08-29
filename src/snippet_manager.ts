import * as fs from "fs";
import * as path from "path";
import * as vscode from "vscode";
import { walkSync } from 'walk';
import { getIgnoredSnippets, getSnipsDirs } from "./kv_store";
import { parse, Snippet } from "./parse";
import { Logger } from "./logger";

export {
  Snippet,
};

type SnipFileEntry = {
  fullPath: string
  /**
   * 相对于 SnipsDir 的路径
   */
  shortPath: string
};

export class SnippetManager {
  /**
   * 记录某语言已经解析过的 Snippet
   */
  protected snippetsByLanguage = new Map<string, Snippet[]>();
  /**
   * All `.snippet` in snips dirs
   */
  protected snipFileEntries: SnipFileEntry[] = [];

  private snippetsIsAdded = new Map<string, Promise<boolean>>();

  public addLanguage(language: string) {
    if (!this.snippetsByLanguage.get(language)) {
      Logger.info("Start repush the", language, "from local dir");

      this.snippetsIsAdded.set(language, new Promise<boolean>((resolve) => {
        vscode.window.setStatusBarMessage("[Vsnips]: Start add language " + language);
        this.doAddLanguageType(language);
        Logger.info(" End  repush the", language, "from local dir");
        vscode.window.setStatusBarMessage("[Vsnips]: End  add language " + language);
        resolve(true);
      }));
    } else {
      Logger.debug(language, "has been added");
    }
  }

  public init() {
    this.refreshSnipFilePaths();
    this.initDefaultLanguage();
  }

  protected initDefaultLanguage() {
    this.addLanguage("all");
  }

  /**
   * 根据语言查询可用 snippets,
   * `all.snippets` 可以被所有语言使用
   */
  public async getSnippets(language: string) {
    return new Promise<Snippet[]>((resolve, reject)=> {
      const isAdded = this.snippetsIsAdded.get(language);
      if(isAdded === undefined) {
        reject("The " + language + " does't add yet");
        return;
      }
      // 只有在当前语言全部添加完成后, 才返回
      isAdded.then(() => {
        const snippetsOfLanguage = this.snippetsByLanguage.get(language) || [];
        const snippetsOfAll = this.snippetsByLanguage.get("all") || [];
        resolve(snippetsOfAll.concat(snippetsOfLanguage));
      });
    });
  }

  /**
   * 查找某语言的 snippet 文件需要稍微多一点的 pattern matching （见 doAddLanguageType）
   * 为了避免多次遍历文件系统，此处提前全部遍历一遍，记录所有 snippet 文件路径
   */
  protected refreshSnipFilePaths() {
    const fileEntries: SnipFileEntry[] = [];
    getSnipsDirs().forEach(snipDir => {
      walkSync(snipDir, {
        listeners: {
          names(base, names, next) {
            const relToSnipDir = path.relative(snipDir, base);
            const shouldIgnore = relToSnipDir[0] === "."; // ignore dot files like '.git'
            if (!shouldIgnore) {
              const localEntries = names
                .filter(name => {
                  return path.extname(name) === ".snippets";
                })
                .map(name => {
                  return {
                    fullPath: path.join(base, name),
                    shortPath: path.join(relToSnipDir, name)
                  };
                });
              fileEntries.push(...localEntries);
              next();
            }
          }
        }
      });
    });
    this.snipFileEntries = fileEntries;
  }

  /**
   * 遍历 snips dirs 寻找对应语言的 snippets 文件并解析
   */
  protected doAddLanguageType(fileType: string) {
    const snippets: Snippet[] = [];

    const snippetFilePaths = this.snipFileEntries.reduce((out: string[], entry) => {
      let shouldAdd = false;
      const { shortPath, fullPath } = entry;
      if (shortPath.startsWith(fileType)) {
        const rest = shortPath.substr(fileType.length);
        // @see https://github.com/SirVer/ultisnips/blob/master/doc/UltiSnips.txt#L522
        if (["/", "_", "."].includes(rest[0])) {
          shouldAdd = true;
        }
      }
      if (shouldAdd && fs.existsSync(fullPath)) {
        out.push(fullPath);
      }
      return out;
    }, []);

    snippetFilePaths.forEach((snipFile) => {
      const fileContent = fs.readFileSync(snipFile, "utf8");

      // 如果 snippet中有extends语句, 根据 snippetsFilePath 查找同目录的 parent .snippets 文件
      try {
        const fileSnippets = parse(fileContent);
        const ignoredSnippets = getIgnoredSnippets();
        fileSnippets.forEach((snipItem) => {
          let isIgnored = false;
          ignoredSnippets.forEach((ignoredSnippet) => {
            const [file, prefix] = ignoredSnippet.split(':');
            if (snipFile === file && snipItem.prefix === prefix) {
              isIgnored = true;
              return;
            }
          });

          if (isIgnored) {
            Logger.info(`The ${snipFile} ${snipItem.prefix} has been ignored`);
            return ;
          } else {
            snippets.push(snipItem);
          }
        });
      } catch (error) {
        Logger.error(`Parse ${snipFile} with error: ${error}`);
      }
    });
    if (fileType === 'all') {
      const vboxSnipContent = `snippet vbox "A nice box with the current comment symbol" w\n` +
          `\`!p snip.rv = get_simple_box(snip)\`\n` +
          `endsnippet`;
      const vboxSnippet = parse(vboxSnipContent)[0];
      snippets.push(vboxSnippet);
    } else {
      // Add the vdoc snippets for current file type, a little ugly.
      // 允许自己添加
      const vdocSnipContent = `snippet doc "Auto make ${fileType} doc"\n` +
        `\`!p snip.rv = get_${fileType}_doc(snip)\`\n` +
        `endsnippet\nsnippet vdoc "Auto make ${fileType} doc"\n` +
        `\`!p snip.rv = get_${fileType}_doc(snip)\`\n` +
        `endsnippet
      `;
      const vdocSnippet = parse(vdocSnipContent);
      snippets.push(...vdocSnippet);
    }

    this.snippetsByLanguage.set(fileType, snippets);
  }
}

export const snippetManager = new SnippetManager();
