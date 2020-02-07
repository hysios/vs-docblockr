import { Parser } from '../../parser';
import { Param, Tokens } from '../../tokens';

import { DocumentSymbol, Position, window } from 'vscode';

export class TypeScript extends Parser {
  /**
   * @inheritdoc
   */
  protected getActivePosition(): Position {
    const { activeTextEditor } = window;

    const position = activeTextEditor.selection.active;

    return activeTextEditor.document.lineAt(position.line + 1).range.start;
  }

  protected parserParameters(symbol: DocumentSymbol, tokens: Tokens): Tokens {
    const snippet = this.getSnippetFromRange(symbol.range);

    const regex = /([a-zA-Z0-9$_]+)\(([a-zA-Z0-9$_:,\s]*)\)(:\s*[a-zA-Z0-9$_]*)\s*{/m;

    if (!regex.test(snippet)) {
      return tokens;
    }

    const results = regex.exec(snippet);

    const parameters = results[1];

    if (parameters) {
      const parameterList = parameters.replace(' ', '').split(',');

      parameterList.forEach((parameter) => {
        const [name, type] = parameter.split(':');

        const param: Param = {
          name,
        };

        if (type) {
          param.type = type;
        }

        tokens.params.push(param);
      });
    }

    return tokens;
  }
}
