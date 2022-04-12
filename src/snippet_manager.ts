import * as path from "path";
import * as vscode from "vscode";
import { getIgnoredSnippets, getSnipsDirs, isInBrowser } from "./kv_store";
import { parse, Snippet } from "./parse";
import { Logger } from "./logger";

export {
  Snippet,
};

type SnipFileEntry = {
  fullPath: string

  uri: vscode.Uri
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

  public async addLanguage(language: string) {
    if (!this.snippetsByLanguage.get(language)) {
      Logger.info("Start repush the", language, "from local dir");

      this.snippetsIsAdded.set(language, new Promise<boolean>((resolve) => {
        vscode.window.setStatusBarMessage("[Vsnips]: Start add language " + language);
        this.doAddLanguageType(language).then(() => {
          Logger.info(" End  repush the", language, "from local dir");
          vscode.window.setStatusBarMessage("[Vsnips]: End  add language " + language);
          resolve(true);
        });
      }));
    } else {
      Logger.debug(language, "has been added");
    }
  }

  public async init(context: vscode.ExtensionContext) {
    if (isInBrowser()) {
      this.browserSnipFilePaths(context);
    } else {
      this.refreshSnipFilePaths();
    }
    await this.initDefaultLanguage();
  }

  protected async initDefaultLanguage() {
    await this.addLanguage("all");
  }

  /**
   * 根据语言查询可用 snippets,
   * `all.snippets` 可以被所有语言使用
   */
  public async getSnippets(language: string) {
    return new Promise<Snippet[]>((resolve, reject) => {
      const isAdded = this.snippetsIsAdded.get(language);
      if (isAdded === undefined) {
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
  protected browserSnipFilePaths(context: vscode.ExtensionContext) {
    // 浏览器中的行为不同, 在浏览器中, 只有当前语言的 snippets 才会被添加
    const availableLanguages = ['c', 'cpp', 'javascript', 'lua', 'python', 'tex', 'texmatch'];
    const fileEntries: SnipFileEntry[] = [];
    availableLanguages.forEach((lang) => {
      const uri = vscode.Uri.joinPath(context.extensionUri, 'Ultisnips', `${lang}.snippets`);
      fileEntries.push({
        fullPath: uri.toString(),
        uri: uri,
        shortPath: `${lang}.snippets`
      });
    });
    this.snipFileEntries = fileEntries;
  }

  /**
   * 查找某语言的 snippet 文件需要稍微多一点的 pattern matching （见 doAddLanguageType）
   * 为了避免多次遍历文件系统，此处提前全部遍历一遍，记录所有 snippet 文件路径
   */
  protected async refreshSnipFilePaths() {
    const fileEntries: SnipFileEntry[] = [];
    getSnipsDirs().forEach(async (snipDir) => {
      for (const [name, type] of await vscode.workspace.fs.readDirectory(vscode.Uri.file(snipDir))) {
        if (type !== vscode.FileType.File) {
          continue;
        }
        if (path.extname(name) !== ".snippets") {
          continue;
        }
        Logger.debug("Found snippet file:", path.join(snipDir, name));

        const relToSnipDir = path.relative(snipDir, snipDir);
        fileEntries.push(
          {
            fullPath: path.join(snipDir, name),
            uri: vscode.Uri.file(path.join(snipDir, name)),
            shortPath: path.join(relToSnipDir, name)
          }
        );
      }
    });
    this.snipFileEntries = fileEntries;
  }

  /**
   * 遍历 snips dirs 寻找对应语言的 snippets 文件并解析
   */
  protected async doAddLanguageType(fileType: string) {
    const snippets: Snippet[] = [];

    const snippetFilePaths = await this.snipFileEntries.reduce(async (_out: Promise<vscode.Uri[]>, entry) => {
      let shouldAdd = false;
      const { shortPath, uri } = entry;
      if (shortPath.startsWith(fileType)) {
        const rest = shortPath.substr(fileType.length);
        // @see https://github.com/SirVer/ultisnips/blob/master/doc/UltiSnips.txt#L522
        if (["/", "_", "."].includes(rest[0])) {
          shouldAdd = true;
        }
      }
      const out = await _out;

      if (shouldAdd) {
        try {
          await vscode.workspace.fs.stat(uri);
          out.push(uri);
        } catch (error) {
          Logger.error("Can't get snipfile stat", uri.toString(), error);
        }
      }
      return out;
    }, Promise.resolve([]));

    Logger.info(`Put all snippets for: ${fileType} in ${snippetFilePaths}`);

    snippetFilePaths.forEach(async (uri) => {
      const snipFile = uri.toString();
      const rawContent = await vscode.workspace.fs.readFile(uri);
      const fileContent = String.fromCharCode(...rawContent);

      // 如果 snippet中有extends语句, 根据 snippetsFilePath 查找同目录的 parent .snippets 文件
      try {
        const fileSnippets = parse(fileContent);
        const ignoredSnippets = getIgnoredSnippets();
        Logger.info(`Get ignored snippets ${ignoredSnippets}`);
        fileSnippets.forEach((snipItem) => {
          let isIgnored = false;
          ignoredSnippets.forEach((ignoredSnippet) => {
            const [file, prefix] = ignoredSnippet.split(':');
            if (uri.fsPath === file && snipItem.prefix === prefix) {
              isIgnored = true;
              return;
            }
          });

          if (isIgnored) {
            Logger.info(`The ${snipFile} ${snipItem.prefix} has been ignored`);
            return;
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
