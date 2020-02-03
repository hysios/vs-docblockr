'use strict';

import { Renderer } from './renderer';
import { Tokens } from './tokens';

import {
  commands,
  DocumentSymbol,
  SymbolKind,
  window,
} from 'vscode';

export class Parser {
  public async init(): Promise<string> {
    const renderer = new Renderer();

    try {
      return renderer.renderBlock(await this.tokenize());
    } catch {
      return renderer.renderEmptyBlock();
    }
  }

  /**
   * Fetch the document symbol underneath the currently selected line
   *
   * @return A array with the selected code snippet
   */
  public async getSymbols(): Promise<DocumentSymbol[]> {
    const { activeTextEditor } = window;

    const { uri } = activeTextEditor.document;
    const position = activeTextEditor.selections[0].active;

    // Retrieve a selection range below the currently highlighted line
    const { range }  = activeTextEditor.document.lineAt(position.line + 1);

    const command = 'vscode.executeDocumentSymbolProvider';

    let symbols = await commands.executeCommand<DocumentSymbol[]>(command, uri);

    // Flatten the first level of child symbols for greater filtering depth
    symbols.forEach((symbol) => {
      symbols.push(...symbol.children);
    });

    console.log(range);

    console.log(symbols);

    return symbols.filter((symbol) => {
      // Only retrieve the symbol that is below the currently selected line
      return symbol.range.contains(range)
    });
  }

  /**
   * Process the `documentSymbols` into `Tokens`.
   *
   * @return A tokenized representation of the highlighted code
   */
  public async tokenize(): Promise<Tokens> {
    let tokens = new Tokens();

    return await this.getSymbols().then((symbols) => {
      symbols.forEach((symbol) => {
        tokens = this.parseClass(symbol, tokens);
        tokens = this.parseFunction(symbol, tokens);
        tokens = this.parseVariable(symbol, tokens);
      });

      return tokens;
    });
  }

  protected parseClass(symbol: DocumentSymbol, tokens: Tokens) {
    if (symbol.kind === SymbolKind.Class) {
      tokens.name = symbol.name;
      tokens.type = SymbolKind.Class;
    }

    return tokens;
  }

  protected parseFunction(symbol: DocumentSymbol, tokens: Tokens) {
    const functionTypes = [
      SymbolKind.Function,
      SymbolKind.Method,
    ];

    if (functionTypes.includes(symbol.kind)) {
      tokens.name = symbol.name;
      tokens.type = SymbolKind.Function;
    }

    return tokens;
  }

  protected parseVariable(symbol: DocumentSymbol, tokens: Tokens) {
    if (symbol.kind === SymbolKind.Variable) {
      tokens.name = symbol.name;
      tokens.type = SymbolKind.Variable;
    }

    return tokens;
  }
}
