/**
 * Per language parser settings
 */

/**
 * Options object
 *
 * Can have any property name
 */
export interface Options {
  [key: string]: any;
}

/**
 * Object of language specific settings
 */
export class Settings {
  /**
   * Start of a doc block
   */
  public commentOpen: string = '/**';

  /**
   * End of a doc block
   */
  public commentClose: string = ' */';

  /**
   * End of doc block string
   */
  public eos: string = '\n';

  /**
   * The beginning set of characters for a doc block
   */
  public separator: string = ' * ';

  /**
   * Dynamically updates class properties based on options object
   *
   * @param  {Options}  options  Options specific to language
   */
  constructor(options: Options = {}) {
    // Loop over options
    for (const option in options) {
      // Check if option exists in settlings
      if (this.hasOwnProperty(option)) {
        // Apply option to settings
        this[option] = options[option];
      }
    }
  }
}
