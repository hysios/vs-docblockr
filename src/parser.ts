import { Renderer } from './renderer';
import { Tokens } from './tokens';

import { commands, DocumentSymbol, Position, Range, SymbolKind, window } from 'vscode';

export class Parser {
  /**
   * Checks if a `SymbolKind` is in the class whitelist
   *
   * This is used to check if a symbol is what this extension considers a class
   *
   * @param   kind  The `SymbolKind` to check
   *
   * @return        True if the `Symbol` kind is in the class whitelist
   */
  public static isClass(kind: SymbolKind): boolean {
    const types = [
      SymbolKind.Class,
      SymbolKind.Namespace,
      SymbolKind.Object,
    ];

    return types.includes(kind);
  }

  /**
   * Checks if a `SymbolKind` is in the function whitelist
   *
   * This is used to check if a symbol is what this extension considers a
   * function
   *
   * @param   kind  The `SymbolKind` to check
   *
   * @return        True if the `Symbol` kind is in the function whitelist
   */
  public static isFunction(kind: SymbolKind): boolean {
    const types = [
      SymbolKind.Constructor,
      SymbolKind.Function,
      SymbolKind.Method,
    ];

    return types.includes(kind);
  }

  /**
   * Checks if a `SymbolKind` is in the variable whitelist
   *
   * This is used to check if a symbol is what this extension considers a
   * variable
   *
   * @param   kind  The `SymbolKind` to check
   *
   * @return        True if the `Symbol` kind is in the variable whitelist
   */
  public static isVariable(kind: SymbolKind): boolean {
    const types = [
      SymbolKind.Constant,
      SymbolKind.Property,
      SymbolKind.Variable,
    ];

    return types.includes(kind);
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

    if (!Array.isArray(symbols)) {
      throw new TypeError('Failed to parse document symbols');
    }

    symbols.forEach((symbol) => {
      symbols.push(...symbol.children);
    });

    symbols = symbols.filter((symbol) => {
      // Only retrieve the symbol that is below the currently selected line
      return symbol.range.contains(position);
    });

    return symbols.pop();
  }

  public async init(): Promise<string> {
    const renderer = new Renderer();

    try {
      return renderer.renderBlock(await this.tokenize());
    } catch {
      return renderer.renderEmptyBlock();
    }
  }

  /**
   * Process the `documentSymbols` into `Tokens`.
   *
   * @return A tokenized representation of the highlighted code
   */
  public async tokenize(): Promise<Tokens> {
    let tokens = new Tokens();

    return await this.getSymbol().then((symbol) => {
      if (Parser.isClass(symbol.kind) || Parser.isVariable(symbol.kind)) {
        tokens.name = symbol.name;
        tokens.type = symbol.kind;
      } else {
        tokens = this.parseFunction(symbol, tokens);
      }

      return tokens;
    });
  }

  /**
   * Retrieve the range of the code currently being parsed
   *
   * @return The range of the code being parsed
   */
  protected getActivePosition(): Position {
    return window.activeTextEditor.selection.active;
  }

  protected getSnippetFromRange(range: Range): string {
    return window.activeTextEditor.document.getText(range);
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
    if (Parser.isFunction(symbol.kind)) {
      tokens.name = symbol.name;
      tokens.type = symbol.kind;

      tokens = this.parserParameters(symbol, tokens);
    }

    return tokens;
  }

  protected parserParameters(symbol: DocumentSymbol, tokens: Tokens): Tokens {
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
        });
      });
    }

    return tokens;
  }
}
