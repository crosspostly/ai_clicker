/**
 * InstructionParser - Parse user instructions and AI responses into actions
 */

class InstructionParser {
  /**
   * Parse natural language instructions to actions
   * @param {string} instructions - User instructions
   * @param {GeminiAI} aiService - AI service instance
   * @returns {Promise<Array>} Parsed actions
   */
  static async parse(instructions, aiService) {
    Validator.validateInstructions(instructions);

    if (!aiService) {
      throw new Error('AI service not available');
    }

    try {
      Logger.info('InstructionParser', 'Parsing instructions');
      const actions = await aiService.parseInstructions(instructions);

      // Validate parsed actions
      const validatedActions = this.validateActions(actions);

      Logger.info('InstructionParser', 'Parsing complete', {
        count: validatedActions.length,
      });

      return validatedActions;
    } catch (error) {
      Logger.error('InstructionParser', 'Parsing failed', error);
      throw error;
    }
  }

  /**
   * Validate parsed actions
   * @param {Array} actions - Actions to validate
   * @returns {Array} Validated actions
   * @throws {Error} If validation fails
   */
  static validateActions(actions) {
    if (!Array.isArray(actions)) {
      throw new Error('Actions must be an array');
    }

    if (actions.length === 0) {
      throw new Error('No actions parsed');
    }

    if (actions.length > 1000) {
      throw new Error('Too many actions (max 1000)');
    }

    const validatedActions = [];

    for (let i = 0; i < actions.length; i++) {
      const action = actions[i];

      try {
        const validated = this.validateSingleAction(action);
        validatedActions.push(validated);
      } catch (error) {
        Logger.warn('InstructionParser', `Action ${i} validation failed`, error);
        throw error;
      }
    }

    return validatedActions;
  }

  /**
   * Validate single action
   * @param {Object} action - Action to validate
   * @returns {Object} Validated action
   * @throws {Error} If validation fails
   */
  static validateSingleAction(action) {
    if (!action || typeof action !== 'object') {
      throw new Error('Action must be an object');
    }

    const validTypes = [
      'click',
      'double_click',
      'right_click',
      'input',
      'select',
      'scroll',
      'wait',
      'hover',
    ];

    if (!action.type || !validTypes.includes(action.type)) {
      throw new Error(`Invalid action type: ${action.type}`);
    }

    if (!action.selector && action.type !== 'scroll' && action.type !== 'wait') {
      throw new Error(`Missing selector for ${action.type}`);
    }

    if (action.selector) {
      Validator.validateSelector(action.selector);
    }

    const validated = {
      type: action.type,
      ...(action.selector && { selector: action.selector }),
      ...(action.value && { value: action.value }),
      ...(action.duration && { duration: action.duration }),
      ...(action.pixels && { pixels: action.pixels }),
      ...(action.text && { text: action.text }),
    };

    return validated;
  }

  /**
   * Convert recorded actions to JSON
   * @param {Array} actions - Recorded actions
   * @returns {string} JSON string
   */
  static toJSON(actions) {
    return JSON.stringify(actions, null, 2);
  }

  /**
   * Parse JSON actions back to array
   * @param {string} jsonString - JSON string
   * @returns {Array} Parsed actions
   * @throws {Error} If parsing fails
   */
  static fromJSON(jsonString) {
    try {
      const actions = JSON.parse(jsonString);

      if (!Array.isArray(actions)) {
        throw new Error('JSON must represent an array');
      }

      return this.validateActions(actions);
    } catch (error) {
      Logger.error('InstructionParser', 'JSON parsing failed', error);
      throw error;
    }
  }

  /**
   * Merge multiple action arrays
   * @param {...Array} actionArrays - Action arrays to merge
   * @returns {Array} Merged actions
   */
  static merge(...actionArrays) {
    const merged = [];

    for (const actions of actionArrays) {
      if (Array.isArray(actions)) {
        merged.push(...actions);
      }
    }

    return this.validateActions(merged);
  }

  /**
   * Filter actions by type
   * @param {Array} actions - Actions to filter
   * @param {string} type - Action type to filter
   * @returns {Array} Filtered actions
   */
  static filterByType(actions, type) {
    if (!Array.isArray(actions)) {
      return [];
    }

    return actions.filter(action => action.type === type);
  }

  /**
   * Get action statistics
   * @param {Array} actions - Actions to analyze
   * @returns {Object} Statistics
   */
  static getStats(actions) {
    if (!Array.isArray(actions)) {
      return null;
    }

    const stats = {
      total: actions.length,
      byType: {},
    };

    const validTypes = [
      'click',
      'double_click',
      'right_click',
      'input',
      'select',
      'scroll',
      'wait',
      'hover',
    ];

    validTypes.forEach(type => {
      const count = actions.filter(a => a.type === type).length;
      if (count > 0) {
        stats.byType[type] = count;
      }
    });

    return stats;
  }

  /**
   * Generate description of actions
   * @param {Array} actions - Actions to describe
   * @returns {string} Human-readable description
   */
  static describe(actions) {
    if (!Array.isArray(actions) || actions.length === 0) {
      return 'No actions';
    }

    const stats = this.getStats(actions);
    const parts = [];

    Object.entries(stats.byType).forEach(([type, count]) => {
      const typeLabel = this.getTypeLabel(type);
      parts.push(`${count} ${typeLabel}${count > 1 ? 's' : ''}`);
    });

    return `${stats.total} actions: ${parts.join(', ')}`;
  }

  /**
   * Get human-readable label for action type
   * @param {string} type - Action type
   * @returns {string} Label
   */
  static getTypeLabel(type) {
    const labels = {
      click: 'click',
      double_click: 'double click',
      right_click: 'right click',
      input: 'input',
      select: 'select',
      scroll: 'scroll',
      wait: 'wait',
      hover: 'hover',
    };

    return labels[type] || type;
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = InstructionParser;
}
