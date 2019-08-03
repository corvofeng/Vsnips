// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import { Logger, InitLogger } from "./logger";
import { generate } from "./generate";
import { setLogLevel, addSnipsDir, getVarfiles, addVarfiles, clearSnipsDir } from "./kv_store";
import { init_vim_var } from "./script_tpl";

export async function activate(context: vscode.ExtensionContext) {
  const VsnipLogLvl = vscode.workspace
    .getConfiguration()
    .get("Vsnips.LogLevel", "NO");
  setLogLevel(VsnipLogLvl);
  InitLogger();

  Logger.info('Congratulations, your extension "Vsnips" is now active!');

  const useDefaultSnips = vscode.workspace
    .getConfiguration()
    .get("Vsnips.UseDefaultSnips", true);
  if (!useDefaultSnips) {
    Logger.warn("Currently we don't use the default snips dir.");
    clearSnipsDir();
  }

  // 添加snips文件夹
  const vsnipDirs = vscode.workspace
    .getConfiguration()
    .get("Vsnips.SnipsDir", []);
  Logger.info("Get Vsnip dirs ", vsnipDirs, "now we start create snippets");
  addSnipsDir(vsnipDirs);

  // 添加vim变量
  const vimFiles = vscode.workspace
    .getConfiguration()
    .get("Vsnips.VarFiles", []);
  Logger.info("Get Vimfiles ", vimFiles, "now we start create snippets");
  addVarfiles(vimFiles);
  init_vim_var(getVarfiles());

  await generate(context);
}

// this method is called when your extension is deactivated
export function deactivate() {}
