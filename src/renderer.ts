import { Parser } from './parser';
import { Settings } from './settings';
import { Tokens } from './tokens';

import * as vscode from 'vscode';

export class Renderer {
  /**
   * Extensions configuration settings
   *
   * @var  {vscode.WorkspaceConfiguration}
   */
  public config: vscode.WorkspaceConfiguration;

  /**
   * Number of spaces between tag elements. Retrieved from editor configuration
   *
   * @var  {string}
   */
  public columns: string;

  /**
   * Language specific parser settings
   *
   * @var  {Settings}
   */
  public settings: Settings;

  /**
   * Block comment style determined by user
   *
   * @var  {string}
   */
  public style: string;

  /**
   * Placeholder for when type (parameter or return) isn't present
   *
   * @var  {string}
   */
  public typePlaceholder: string = '[type]';

  constructor() {
    // Get extension configuration
    this.config = vscode.workspace.getConfiguration('vs-docblockr');
    // Get column spacing from configuration object
    const column: number = this.config.get('columnSpacing');
    // Generate spaces based on column number
    this.columns = Array(column + 1).join(' ');
    // Get block comment style specified by user
    this.style = this.config.get('commentStyle');
    this.settings = new Settings();
  }

  /**
   * Renders docblock string based on tokenized object
   *
   * @param   {Tokens}  tokens  Tokenized docblock object
   *
   * @return  {string}          Generated docblock string
   */
  public renderBlock(tokens: Tokens): string {
    // Incremented count value for incrementing tab selection number
    let count = 1;
    // Convert string to a snippet placeholder and auto-increment the counter
    // on each call
    const placeholder = (str: string) => `\$\{${count++}:${str}\}`;
    // Handler each part of docblock, including the empty lines, as a list that
    // will be joined at the end
    let blockList: string[] = [];
    // Function description
    blockList.push(placeholder(`[${this.escape(tokens.name)} description]`));
    // Parameter tags
    blockList = this.renderParamTags(tokens, blockList, placeholder);
    // Return tag
    blockList = this.renderReturnTag(tokens, blockList, placeholder);
    // Var tag
    blockList = this.renderVarTag(tokens, blockList, placeholder);

    const {
      commentClose,
      commentOpen,
      eos,
      separator,
    } = this.settings;

    let block = commentOpen + eos + blockList.map((blockLine) => {
      return separator + blockLine;
    }).join(eos) + eos + commentClose;

    // Attempt to strip out trailing whitespace
    block = block.replace(/\s$/gm, '');

    return block;
  }

  /**
   * Generates an empty doc block string when nothing was successfully parsed
   *
   * @return  Empty doc block string
   */
  public renderEmptyBlock(): string {
    const {
      commentClose,
      commentOpen,
      eos,
      separator,
    } = this.settings;

    return commentOpen + eos + separator + eos + commentClose;
  }

  protected renderEmptyLine(blockList: string[]): string[] {
    blockList.push('');

    return blockList;
  }

  /**
   * Renders parameter tag template for docblock
   *
   * Arguments c, t, p should be assumed to be computed by `renderParamTags()`.
   * These ambiguous argument names simply to the spaces between columns.
   *
   * @param   {string}  c     Spaces computed between initial tag and param type
   * @param   {string}  type  The variable type of said parameter
   * @param   {string}  t     Spaces computed between param type and param name
   * @param   {string}  name  Parameter's name binding
   * @param   {string}  p     Spaces computed between param name and description
   * @param   {string}  desc  Describes the parameter
   *
   * @return  {string}        Rendered parameter tag
   */
  protected getParamTag(
    c:    string,
    type: string,
    t:    string,
    name: string,
    p:    string,
    desc: string): string {
    let tag = `@param${c} ${type}${t}${name}${p}${desc}`;

    if (this.style === 'drupal') {
      tag = `@param ${type} ${name}\n${this.settings.separator}  ${desc}`;
    }

    return tag;
  }

  /**
   * Renders parameter tags for docblock
   *
   * @param   {Tokens}    tokens       Tokenized code
   * @param   {string[]}  blockList    List of docblock lines
   * @param   {Function}  placeholder  Function for snippet formatting
   *
   * @return  {string[]}               Parameter blocks appended to block
   *                                   list. Returns list pasted in if no
   *                                   parameters
   */
  protected renderParamTags(
    tokens: Tokens,
    blockList: string[],
    placeholder: (str: string) => string,
  ): string[] {
    // Parameter tags shouldn't be needed if no parameter tokens are available,
    // or if the code is a class property or variable
    if (tokens.params.length && Parser.isFunction(tokens.type)) {
      return blockList;
    }

    // Get column spacing from configuration object
    const column: number = this.config.get('columnSpacing');

    blockList = this.renderEmptyLine(blockList);

    // Determine if any parameters contain defined type information for
    // calculating type spacing
    const hasType = tokens.params.some((param) => param.hasOwnProperty('type'));
    // Iterator over list of parameters
    for (const param of tokens.params) {
      // Define type placeholder in the instance none was provided
      const noType = this.typePlaceholder;
      // Calculate difference in name size
      const diff = this.maxParams(tokens, 'name') - param.name.length;
      // Calculate total param name spaces
      const pSpace = Array((column + 1) + diff).join(' ');
      // Define typeDiff as 1 to ensure there is at least one space between
      // type and parameter name in docblock
      let typeDiff = 1;
      // Check if any params have a defined type, if no the type space
      // difference should default to 1
      if (hasType) {
        // Get maximum parameter type size
        const tDiff = this.maxParams(tokens, 'type');
        // Check if current parameter has a defined type
        if (param.hasOwnProperty('type')) {
          // Calculate difference between longest type and current type
          // The added 1 fixes size discrepancies
          typeDiff = tDiff - param.type.length + 1;
        } else {
          // Account for parameters without types by getting length of type
          // placeholder
          typeDiff = tDiff - noType.length + 1;
        }
      }
      // Calculate type spacing
      const tSpace = Array((column) + typeDiff).join(' ');
      // Shortcut for column space
      const cSpace = this.columns;
      // Define parameter type
      let type = '';
      // Check if parameter has a type
      if (param.hasOwnProperty('type')) {
        // Get parameter type from token object
        type = placeholder(this.escape(param.type));
      } else {
        // Use param type placeholder
        type = placeholder(noType);
      }
      // Prevent tabstop conflicts
      const name = this.escape(param.name);
      // Description shortcut
      const desc = placeholder(`[${name} description]`);
      // Append param to docblock
      blockList.push(this.getParamTag(cSpace, type, tSpace, name, pSpace,
        desc));
    }
    return blockList;
  }

  /**
   * Renders return tag with return type and computed spacing
   *
   * @param   {string}  type     Type associated with return value (in docblock
   *                             not this method)
   * @param   {string}  spacing  Spacing between type and description
   * @param   {string}  desc     Return description
   *
   * @return  {string}           Rendered return tag
   */
  protected getReturnTag(type: string, spacing: string, desc: string): string {
    let tag = `@return${this.columns}${type}${spacing}${desc}`;

    if (this.style === 'drupal') {
      tag = `@return ${type}\n${this.settings.separator}  ${desc}`;
    }

    return tag;
  }

  /**
   * Render return tag for docblock
   *
   * @param   {Tokens}    tokens       Tokenized code
   * @param   {string[]}  blockList    List of docblock lines
   * @param   {Function}  placeholder  Function for snippet formatting
   *
   * @return  {string[]}               Return block appended to block list.
   *                                   Returns list provided if variable or no
   *                                   return tag
   */
  protected renderReturnTag(
    tokens: Tokens,
    blockList: string[],
    placeholder: (str: string) => string,
  ): string[] {
    if (!Parser.isFunction(tokens.type)) {
      return blockList;
    }

    // Get column spacing from configuration object
    const column: number = this.config.get('columnSpacing');
    // Determine whether or not to display the return type by default
    const defaultReturnTag: boolean = this.config.get('defaultReturnTag');
    // Check if return section should be displayed
    if (tokens.return.present && defaultReturnTag) {
      let type = this.typePlaceholder;
      // Check if a return type was provided
      if (tokens.return.type) {
        type = this.escape(tokens.return.type);
      }
      // Empty line
      blockList = this.renderEmptyLine(blockList);
      // Get maximum param size
      const diff = this.maxParams(tokens, 'name');
      const tDiff = this.maxParams(tokens, 'type');
      // Calculate number of spaces between return type and description
      let spacingTotal = tDiff - type.length + column + diff + column + 1;
      // Set spacing to column spacing in settings if value is less than
      // default column spacing plus one. This can happen when there are no
      // parameters
      if (spacingTotal < column) spacingTotal = column + 1;
      // Determine the spacing between return type and description
      const spacing = Array(spacingTotal).join(' ');
      // Format type to be tab-able
      type = placeholder(type);
      // Format return description to be tab-able
      const desc = placeholder('[return description]');
      // Push return type
      blockList.push(this.getReturnTag(type, spacing, desc));
    }
    return blockList;
  }

  /**
   * Renders var tag with property type and computed spacing
   *
   * @param   {string}  columns  Computed spaces between tag and type
   *
   * @return  {string}           Rendered property tag
   */
  protected getVarTag(type: string): string {
    return `@var ${type}`;
  }

  /**
   * Render var tag for docblock
   *
   * @param   {Tokens}    tokens       Tokenized code
   * @param   {string[]}  blockList    List of docblock lines
   * @param   {Function}  placeholder  Function for snippet formatting
   *
   * @return  {string[]}               Var block appended to block list.
   *                                   Returns list provided if not a variable
   */
  protected renderVarTag(
    tokens: Tokens,
    blockList: string[],
    placeholder: (str: string) => string,
  ): string[] {
    if (!Parser.isVariable(tokens.type)) {
      return blockList;
    }

    blockList = this.renderEmptyLine(blockList);

    // Format type to be tab-able
    const type = tokens.varType ? tokens.varType : this.typePlaceholder;

    blockList.push(this.getVarTag(placeholder(type)));

    return blockList;
  }

  /**
   * Replaces any `$` character with `\\$`
   *
   * Prevents issues with tabstop variables in Visual Studio Code
   *
   * @param   {string}  name  String to be escaped
   *
   * @return  {string}        Properly escaped string
   */
  protected escape(name: string): string {
    return name.replace('$', '\\$');
  }

  /**
   * Finds the longest value property value of property provided
   *
   * Used for spacing out docblock segments per line
   *
   * @param   {Tokens}   tokens    Parsed tokens from code string
   * @param   {propety}  property  The token property to calculate
   *
   * @return  {number}             The longest token value of property provided
   */
  protected maxParams(tokens: Tokens, property: string): number {
    // If no parameters return zero
    if (!tokens.params.length) return 0;
    // Filter out any parameters without property provided
    const filtered = tokens.params.filter((param) => param.hasOwnProperty(property));
    // Convert parameter object into simple list of given property name
    const params: number[] = filtered.map((param) => param[property].length);
    // If nothing parsed return zero
    if (!params.length && property === 'type')
      return this.typePlaceholder.length;
    // Add return type length if type is requested
    if (property === 'type' && tokens.return.type)
      params.push(tokens.return.type.length);
    // Get the longest parameter property in list
    return params.reduce((a, b) => Math.max(a, b));
  }
}
