import { SymbolKind } from 'vscode';

/**
 * Describes a function parameter
 */
export interface Param {
  /**
   * Parameter's name. Should always be present
   */
  name: string;

  /**
   * Parameter's value. Usually empty string if no parameter value is provided
   */
  val: string;

  /**
   * Parameter's data type. This is usually language specific and is not
   * required. Ex. string, integer, array, etc.
   */
  type?: string;
}

interface ReturnToken {
  present: boolean;

  type?: string;
}

export class Tokens {
  public name: string = '';

  public type: SymbolKind;

  public varType?: string = '';

  public return: ReturnToken = {
    present: true,

    type: '',
  };

  public params?: Param[] = [];
}
