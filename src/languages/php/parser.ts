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
  protected parseFunction(symbol: DocumentSymbol, tokens: Tokens): Tokens {
    tokens = super.parseFunction(symbol, tokens);

    symbol.children.forEach((child, i) => {
      const snippet = window.activeTextEditor.document.getText(child.range);

      const pieces = snippet.split(' ');

      if (pieces.length > 1) {
        tokens.params[i].type = pieces[0];
      }
    });

    return tokens;
  }
}
