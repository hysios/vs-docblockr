import { Parser } from '../../parser';
import { Tokens } from '../../tokens';

import { DocumentSymbol, window } from 'vscode';

export class TypeScript extends Parser {
  /**
   * @inheritdoc
   */
  protected parseFunction(symbol: DocumentSymbol, tokens: Tokens): Tokens {
    tokens = super.parseFunction(symbol, tokens);

    return tokens;
  }
}
