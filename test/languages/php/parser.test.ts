import * as assert from 'assert';
import { workspace, window, TextEditor, TextDocument, SnippetString, SymbolKind, Position } from 'vscode';
import { createRandomFile, deleteFile } from '../../utils';
import { Parser } from '../../../src/parser';

suite('PHP Tests', () => {
  async function withRandomFileEditor(initialContents: string, run: (editor: TextEditor, doc: TextDocument) => Thenable<void>) {
    const file = await createRandomFile(initialContents);
    const doc = await workspace.openTextDocument({
      language: 'php',
    });
    const editor_2 = await window.showTextDocument(doc);
    await run(editor_2, doc);
    if (doc.isDirty) {
      return doc.save().then((saved) => {
        assert.ok(saved);
        assert.ok(!doc.isDirty);
        return deleteFile(file);
      });
    } else {
      return deleteFile(file);
    }
  }

  test('insert snippet', () => {
		const snippetString = new SnippetString()
			.appendText('<?php')
      .appendText("\n")
      .appendText('function foo($bar) {')
      .appendText("\n")
			.appendText('}');

		return withRandomFileEditor('', async (editor, doc) => {
			const inserted = await editor.insertSnippet(snippetString);
      let parser = new Parser();

      editor.edit((editBuilder) => {
        const snippet = new SnippetString().appendText('/**\n')

        editBuilder.insert(new Position(1, 0), snippet.value);
      });

      let tokens = await parser.tokenize();

      assert.ok(inserted);
      assert.equal(tokens.name, 'bar');
      assert.equal(tokens.type, SymbolKind.Function);
      assert.ok(doc.isDirty);
		});
	});
});
