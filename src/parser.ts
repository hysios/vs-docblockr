import { Renderer } from './renderer';
import { Tokens } from './tokens';

import { commands, DocumentSymbol, Position, SymbolKind, window } from 'vscode';

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
    return window.activeTextEditor.selection.active;
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


    symbols.forEach((symbol) => {
      symbols.push(...symbol.children);
    });


    symbols = symbols.filter((symbol) => {
      // Only retrieve the symbol that is below the currently selected line
      return symbol.range.contains(position);
    });


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

  protected parseClass(symbol: DocumentSymbol, tokens: Tokens): Tokens {
    if (symbol.kind === SymbolKind.Class) {
      tokens.name = symbol.name;
      tokens.type = SymbolKind.Class;
      tokens.return.present = false;
    }

    return tokens;
  }

  /**
   * Tokenize a `DocumentSymbol` if it is a function
   *
   * @param  symbol  The code snippet represented as a `DocumentSymbol`
   * @param  tokens  Any tokens that have been created from the snippet
   *
   * @return         @TODO
   */
  protected parseFunction(symbol: DocumentSymbol, tokens: Tokens): Tokens {
    const functionTypes = [
      SymbolKind.Function,
      SymbolKind.Method,
    ];

    if (functionTypes.includes(symbol.kind)) {
      tokens.name = symbol.name;
      tokens.type = SymbolKind.Function;

      if (symbol.children) {
        const position = this.getActivePosition();
        const { document } = window.activeTextEditor;

        const { range } = document.lineAt(position.line + 1);

        const filtered = symbol.children.filter((child) => {
          return range.contains(child.range);
        });

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

  protected parseVariable(symbol: DocumentSymbol, tokens: Tokens): Tokens {
    if (symbol.kind === SymbolKind.Variable) {
      tokens.name = symbol.name;
      tokens.type = SymbolKind.Variable;
    }

    return tokens;
  }
}
