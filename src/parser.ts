import { Renderer } from './renderer';
import { Tokens } from './tokens';

import { commands, DocumentSymbol, Position, Range, SymbolKind, window } from 'vscode';

// import { TokenizationRegistry } from 'vscode/editor/common/modes';

export class Parser {
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

    // console.log(position);
    // console.log(symbols);

    symbols = symbols.filter((symbol) => {
      // Only retrieve the symbol that is below the currently selected line
      return symbol.range.start.isAfterOrEqual(position);
    });

    // console.log(symbols);

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
      tokens = this.parseClass(symbol, tokens);
      tokens = this.parseFunction(symbol, tokens);
      tokens = this.parseVariable(symbol, tokens);

      // console.log(tokens);

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

  protected isClass(symbol: DocumentSymbol): boolean {
    const types = [
      SymbolKind.Class,
      SymbolKind.Constant,
      SymbolKind.Namespace,
      SymbolKind.Object,
    ];

    return types.includes(symbol.kind);
  }

  protected isFunction(symbol: DocumentSymbol): boolean {
    const types = [
      SymbolKind.Constructor,
      SymbolKind.Function,
      SymbolKind.Method,
    ];

    return types.includes(symbol.kind);
  }

  protected isVariable(symbol: DocumentSymbol): boolean {
    const types = [
      SymbolKind.Constant,
      SymbolKind.Property,
      SymbolKind.Variable,
    ];

    return types.includes(symbol.kind);
  }

  protected parseClass(symbol: DocumentSymbol, tokens: Tokens): Tokens {
    if (this.isClass(symbol)) {
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
    if (this.isFunction(symbol)) {
      tokens.name = symbol.name;
      tokens.type = SymbolKind.Function;

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
          val: '',
        });
      });
    }

    return tokens;
  }

  protected parseVariable(symbol: DocumentSymbol, tokens: Tokens): Tokens {
    if (this.isVariable(symbol)) {
      tokens.name = symbol.name;
      tokens.type = SymbolKind.Variable;
    }

    return tokens;
  }
}
