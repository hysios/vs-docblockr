/**
 * Handlers getting code string from snippet handler (`snippet.ts`), passing to
 * be lexed code string to lexer and render docblock string.
 *
 * This file is never instantiated directly, rather it is inherited by the
 * current language in use. The language instance is determined by the entry point
 * (`extension.ts`). When the snippet handler (`snippet.ts`) detects a user is
 * trying to create a docblock, the active window editor is passed to the
 * parser (`parser.ts`). The parser then selects the line of code immediately
 * below the selected position. The text below is stored and passed to the
 * lexer (`lexer.ts`). After which, it is up to current language instance of the
 * parser to parse the lexed object returned. The docblock creation is then
 * mostly handled by the parent instance of the parser.
 */

'use strict';

import { Renderer } from './renderer';
import { Tokens } from './tokens';

import {
  commands,
  DocumentSymbol,
  SymbolKind,
  window,
} from 'vscode';

/**
 * Initial Class for parsing Doc Block comments
 */
export class Parser {
  public async init(): Promise<string> {
    const renderer = new Renderer();

    try {
      return renderer.renderBlock(await this.tokenize());
    } catch {
      // If no valid token was created, create an empty doc block string
      return renderer.renderEmptyBlock();
    }
  }

  public async getSymbols(): Promise<DocumentSymbol[]> {
    const { uri } = window.activeTextEditor.document;
    const position = window.activeTextEditor.selection.active;

    const command = 'vscode.executeDocumentSymbolProvider';

    const symbols = await commands.executeCommand<DocumentSymbol[]>(command, uri);

    return symbols.filter((symbol) => symbol.range.start.line === position.line);
  }

  public async tokenize(
    tokens: Tokens = new Tokens(),
  ): Promise<Tokens> {
    return await this.getSymbols().then((symbols) => {
      symbols.forEach((symbol) => {
        if (symbol.kind === SymbolKind.Function) {
          tokens.name = symbol.name;
          tokens.type = 'function';
        }

      });
      return tokens;
    });

    // return tokens;
  }
}
