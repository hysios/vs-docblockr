import * as assert from 'assert';
import { Tokens } from '../src/tokens';
import { TypeScript } from '../src/languages/typescript';

suite('Parser', () => {
  suite('renderBlock', () => {
    test('don\'t return docblock with trailing whitespace', () => {
      // Use the JavaScript parser for the sake of setup
      const parser = new TypeScript();

      const token: Tokens = {
        name: 'foo',
        type: 'function',
        return: {
          present: true,
          type: 'boolean',
        },
        params: [{
          name: 'bar',
          type: 'boolean',
          val: '',
        }],
      };

      const block = parser.renderBlock(token);
      assert.equal(/\s$/gm.test(block), false, 'No trailing whitespace');
    });
  });
});
