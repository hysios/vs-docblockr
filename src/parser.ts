'use strict';

import { Renderer } from './renderer';
import { Tokens } from './tokens';

import { commands, DocumentSymbol, Position, SymbolKind, window} from 'vscode';

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
   * Retrieve the range of the code currently being parsed
   *
   * @return The range of the code being parsed
   */
  protected getActivePosition(): Position {
    const { activeTextEditor } = window;

    return activeTextEditor.selection.active;
  }

  /**
   * Fetch the document symbol underneath the currently selected line
   *
   * @return A array with the selected code snippet
   */
  public async getSymbol(): Promise<DocumentSymbol> {
    const { uri } = window.activeTextEditor.document;

    // Retrieve a selection range below the currently highlighted line
    const position  = this.getActivePosition();

    const command = 'vscode.executeDocumentSymbolProvider';

    let symbols = await commands.executeCommand<DocumentSymbol[]>(command, uri);

    // Flatten the first level of child symbols for greater filtering depth
    symbols.forEach((symbol) => {
      symbols.push(...symbol.children);
    });

    console.log(symbols);

    symbols = symbols.filter((symbol) => {
      // Only retrieve the symbol that is below the currently selected line
      return symbol.range.contains(position);
    });

    console.log(symbols);

    return symbols.pop();
  }

  /**
   * Process the `documentSymbols` into `Tokens`.
   *
   * @return A tokenized representation of the highlighted code
   */
  public async tokenize(): Promise<Tokens> {
    let tokens = new Tokens();

    return await this.getSymbol().then((symbol) => {
      tokens = this.parseClass(symbol, tokens);
      tokens = this.parseFunction(symbol, tokens);
      tokens = this.parseVariable(symbol, tokens);

      return tokens;
    });
  }

  protected parseClass(symbol: DocumentSymbol, tokens: Tokens) {
    if (symbol.kind === SymbolKind.Class) {
      tokens.name = symbol.name;
      tokens.type = SymbolKind.Class;
      tokens.return.present = false;
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

      if (symbol.children) {
        const position = this.getActivePosition();

        const { range } = window.activeTextEditor.document.lineAt(position.line + 1);

        console.log(range);

        const filtered = symbol.children.filter((child) => {
          return range.contains(child.range);
        });

        console.log(symbol.children);
        console.log(filtered);

        filtered.forEach((child) => {
          tokens.params.push({
            name: child.name,
            val: '',
          });
        });
      }
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
