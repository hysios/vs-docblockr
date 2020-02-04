/**
 * PHP specific language parser
 */

'use strict';

import { Parser } from '../../parser';
import { Tokens } from '../../tokens';

import { DocumentSymbol, window } from 'vscode';

export class PHP extends Parser {
  /**
   * @inheritdoc
   */
  protected parseFunction(symbol: DocumentSymbol, tokens: Tokens) {
    tokens = super.parseFunction(symbol, tokens);

    if (symbol.children) {
      symbol.children.forEach((child) => {
        const { document } = window.activeTextEditor;

        const snippet = document.getText(child.range);
      });
    }

    return tokens;
  }
}
