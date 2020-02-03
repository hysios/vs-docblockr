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
      const { activeTextEditor } = window;

      const line = activeTextEditor.selection.active.line + 1;
      const { range } = activeTextEditor.document.lineAt(line);

      symbol.children.filter((child) => range.contains(child.range)).forEach((child) => {
        tokens.params.push({
          name: child.name,
          val: '',
        });
      });
    }

    return tokens;
  }
}
