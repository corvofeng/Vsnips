// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import { Logger, InitLogger } from "./logger";
import { generate } from "./generate";
import {setLogLevel} from "./kv_store";
import { init_vim_var } from "./script_tpl";

// 记录
let DEFAULT_VARS_FILES = [
  '/home/corvo/.vimrc',
  '/home/corvo/.vim/common.vim',
];


export async function activate(context: vscode.ExtensionContext) {
  const VsnipLogLvl = vscode.workspace.getConfiguration().get('Vsnips.LogLevel', 'NO');
  setLogLevel(VsnipLogLvl);
  InitLogger();

  Logger.info('Congratulations, your extension "Vsnips" is now active!');

  const VsnipDirs = vscode.workspace.getConfiguration().get('Vsnips.snipdir');
  Logger.info("Get Vsnip dirs ", VsnipDirs, "now we start create snippets");
  init_vim_var(DEFAULT_VARS_FILES);

  await generate(context);
}

// this method is called when your extension is deactivated
export function deactivate() {}
