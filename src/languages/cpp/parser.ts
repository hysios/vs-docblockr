import { Parser } from '../../parser';
import { Tokens } from '../../tokens';

import { DocumentSymbol } from 'vscode';

export class Cpp extends Parser {
  /**
   * @inheritdoc
   */
  protected parseFunction(symbol: DocumentSymbol, tokens: Tokens): Tokens {
    tokens = super.parseFunction(symbol, tokens);

    return tokens;
  }
}
