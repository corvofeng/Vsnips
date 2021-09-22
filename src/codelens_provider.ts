import * as vscode from 'vscode';
import { Logger } from "./logger";


/**
 * Copy from: https://github.com/microsoft/vscode-extension-samples/blob/main/codelens-sample/src/CodelensProvider.ts
 * CodelensProvider
 */
export class CodelensProvider implements vscode.CodeLensProvider {

  private codeLensMap: Map<string, vscode.CodeLens> = new Map();
  constructor() {}

  public addCodelens(codeLensHash: string, codelens: vscode.CodeLens) {
    this.codeLensMap.set(codeLensHash, codelens);
  }
  public removeCodelens(codeLensHash: string) {
    this.codeLensMap.delete(codeLensHash);
  }

  public provideCodeLenses(document: vscode.TextDocument, token: vscode.CancellationToken): vscode.CodeLens[] | Thenable<vscode.CodeLens[]> {
    Logger.info("In provider codelens");

    let codeLenses: vscode.CodeLens[] = [];
    this.codeLensMap.forEach((data) => {
      codeLenses.push(data);
    })
    return codeLenses;
  }

  // public resolveCodeLens(codeLens: vscode.CodeLens, token: vscode.CancellationToken) {
  //   // if (vscode.workspace.getConfiguration("codelens-sample").get("enableCodeLens", true)) {
  //   Logger.info("In resolve codelens");
  //   return null;
  // }
}

const VSnipsCodelensProider = new CodelensProvider();
export {VSnipsCodelensProider}