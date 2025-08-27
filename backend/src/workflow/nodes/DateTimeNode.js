/**
 * Date & Time Node
 * Handle date and time operations, formatting, and calculations
 */
class DateTimeNode {
  static definition = {
    type: 'datetime',
    name: 'Date & Time',
    description: 'Format, calculate, and manipulate dates and times',
    icon: 'calendar.svg',
    operations: ['format', 'add', 'subtract', 'compare', 'parse', 'now', 'convert'],
    inputs: {
      operation: {
        type: 'string',
        enum: ['format', 'add', 'subtract', 'compare', 'parse', 'now', 'convert'],
        required: true,
        description: 'Date/time operation to perform'
      },
      date: {
        type: 'string',
        description: 'Input date/time (ISO string, timestamp, or formatted date)'
      },
      format: {
        type: 'string',
        default: 'YYYY-MM-DD HH:mm:ss',
        description: 'Output format (using moment.js format)'
      },
      inputFormat: {
        type: 'string',
        description: 'Input date format (for parsing)'
      },
      amount: {
        type: 'number',
        description: 'Amount to add/subtract'
      },
      unit: {
        type: 'string',
        enum: ['years', 'months', 'weeks', 'days', 'hours', 'minutes', 'seconds', 'milliseconds'],
        description: 'Time unit for calculations'
      },
      timezone: {
        type: 'string',
        description: 'Timezone (e.g., America/New_York, UTC)'
      },
      targetTimezone: {
        type: 'string',
        description: 'Target timezone for conversion'
      },
      compareDate: {
        type: 'string',
        description: 'Date to compare against'
      },
      locale: {
        type: 'string',
        default: 'en',
        description: 'Locale for formatting'
      }
    },
    outputs: {
      result: 'The calculated/formatted result',
      timestamp: 'Unix timestamp',
      iso: 'ISO 8601 string',
      formatted: 'Formatted date string',
      comparison: 'Comparison result (-1, 0, 1)',
      success: 'Whether operation succeeded'
    }
  };

  /**
   * Execute date/time operation
   */
  static async execute(step, config, context) {
    try {
      let result;

      switch (config.operation) {
        case 'now':
          result = DateTimeNode.getCurrentTime(config);
          break;
        case 'format':
          result = DateTimeNode.formatDate(config);
          break;
        case 'add':
          result = DateTimeNode.addTime(config);
          break;
        case 'subtract':
          result = DateTimeNode.subtractTime(config);
          break;
        case 'compare':
          result = DateTimeNode.compareDates(config);
          break;
        case 'parse':
          result = DateTimeNode.parseDate(config);
          break;
        case 'convert':
          result = DateTimeNode.convertTimezone(config);
          break;
        default:
          throw new Error(`Unsupported operation: ${config.operation}`);
      }

      return {
        success: true,
        operation: config.operation,
        ...result
      };

    } catch (error) {
      console.error('DateTime operation failed:', error);
      
      if (step.on_error === 'stop') {
        throw error;
      }

      return {
        success: false,
        error: error.message,
        operation: config.operation
      };
    }
  }

  /**
   * Get current time
   */
  static getCurrentTime(config) {
    const now = new Date();
    
    if (config.timezone) {
      // Convert to specified timezone
      const localeString = now.toLocaleString('en-US', { timeZone: config.timezone });
      const timezoneDate = new Date(localeString);
      
      return DateTimeNode.formatDateResult(timezoneDate, config);
    }
    
    return DateTimeNode.formatDateResult(now, config);
  }

  /**
   * Format a date
   */
  static formatDate(config) {
    if (!config.date) {
      throw new Error('Date is required for format operation');
    }

    const date = DateTimeNode.parseInputDate(config.date, config.inputFormat);
    return DateTimeNode.formatDateResult(date, config);
  }

  /**
   * Add time to a date
   */
  static addTime(config) {
    if (!config.date) {
      throw new Error('Date is required for add operation');
    }
    if (typeof config.amount !== 'number') {
      throw new Error('Amount is required for add operation');
    }
    if (!config.unit) {
      throw new Error('Unit is required for add operation');
    }

    const date = DateTimeNode.parseInputDate(config.date, config.inputFormat);
    const result = DateTimeNode.addToDate(date, config.amount, config.unit);
    
    return DateTimeNode.formatDateResult(result, config);
  }

  /**
   * Subtract time from a date
   */
  static subtractTime(config) {
    if (!config.date) {
      throw new Error('Date is required for subtract operation');
    }
    if (typeof config.amount !== 'number') {
      throw new Error('Amount is required for subtract operation');
    }
    if (!config.unit) {
      throw new Error('Unit is required for subtract operation');
    }

    const date = DateTimeNode.parseInputDate(config.date, config.inputFormat);
    const result = DateTimeNode.addToDate(date, -config.amount, config.unit);
    
    return DateTimeNode.formatDateResult(result, config);
  }

  /**
   * Compare two dates
   */
  static compareDates(config) {
    if (!config.date) {
      throw new Error('Date is required for compare operation');
    }
    if (!config.compareDate) {
      throw new Error('Compare date is required for compare operation');
    }

    const date1 = DateTimeNode.parseInputDate(config.date, config.inputFormat);
    const date2 = DateTimeNode.parseInputDate(config.compareDate, config.inputFormat);
    
    const comparison = date1.getTime() - date2.getTime();
    
    return {
      result: comparison,
      comparison: comparison < 0 ? -1 : comparison > 0 ? 1 : 0,
      isEqual: comparison === 0,
      isBefore: comparison < 0,
      isAfter: comparison > 0,
      differenceMs: Math.abs(comparison),
      differenceDays: Math.abs(comparison) / (1000 * 60 * 60 * 24),
      ...DateTimeNode.formatDateResult(date1, config)
    };
  }

  /**
   * Parse a date string
   */
  static parseDate(config) {
    if (!config.date) {
      throw new Error('Date is required for parse operation');
    }

    const date = DateTimeNode.parseInputDate(config.date, config.inputFormat);
    return DateTimeNode.formatDateResult(date, config);
  }

  /**
   * Convert timezone
   */
  static convertTimezone(config) {
    if (!config.date) {
      throw new Error('Date is required for convert operation');
    }
    if (!config.targetTimezone) {
      throw new Error('Target timezone is required for convert operation');
    }

    const date = DateTimeNode.parseInputDate(config.date, config.inputFormat);
    
    // Convert to target timezone
    const localeString = date.toLocaleString('en-US', { timeZone: config.targetTimezone });
    const convertedDate = new Date(localeString);
    
    return {
      ...DateTimeNode.formatDateResult(convertedDate, { ...config, format: config.format }),
      originalTimezone: config.timezone || 'Local',
      targetTimezone: config.targetTimezone
    };
  }

  /**
   * Parse input date from various formats
   */
  static parseInputDate(dateInput, inputFormat) {
    if (dateInput instanceof Date) {
      return dateInput;
    }

    // Try parsing as number (timestamp)
    if (typeof dateInput === 'number') {
      return new Date(dateInput);
    }

    // Try parsing as string
    if (typeof dateInput === 'string') {
      // If input format is specified, use it (basic implementation)
      if (inputFormat) {
        // Simple format parsing - can be enhanced with moment.js
        return new Date(dateInput);
      }
      
      // Try standard formats
      const date = new Date(dateInput);
      if (isNaN(date.getTime())) {
        throw new Error(`Invalid date format: ${dateInput}`);
      }
      return date;
    }

    throw new Error(`Unsupported date input type: ${typeof dateInput}`);
  }

  /**
   * Add time to date
   */
  static addToDate(date, amount, unit) {
    const result = new Date(date.getTime());
    
    switch (unit) {
      case 'milliseconds':
        result.setMilliseconds(result.getMilliseconds() + amount);
        break;
      case 'seconds':
        result.setSeconds(result.getSeconds() + amount);
        break;
      case 'minutes':
        result.setMinutes(result.getMinutes() + amount);
        break;
      case 'hours':
        result.setHours(result.getHours() + amount);
        break;
      case 'days':
        result.setDate(result.getDate() + amount);
        break;
      case 'weeks':
        result.setDate(result.getDate() + (amount * 7));
        break;
      case 'months':
        result.setMonth(result.getMonth() + amount);
        break;
      case 'years':
        result.setFullYear(result.getFullYear() + amount);
        break;
      default:
        throw new Error(`Unsupported time unit: ${unit}`);
    }
    
    return result;
  }

  /**
   * Format date result with multiple output formats
   */
  static formatDateResult(date, config) {
    const format = config.format || 'YYYY-MM-DD HH:mm:ss';
    
    return {
      result: DateTimeNode.formatDateString(date, format),
      formatted: DateTimeNode.formatDateString(date, format),
      timestamp: date.getTime(),
      iso: date.toISOString(),
      locale: date.toLocaleString(config.locale || 'en'),
      date: {
        year: date.getFullYear(),
        month: date.getMonth() + 1,
        day: date.getDate(),
        hour: date.getHours(),
        minute: date.getMinutes(),
        second: date.getSeconds(),
        millisecond: date.getMilliseconds()
      }
    };
  }

  /**
   * Format date string (simplified moment.js-like formatting)
   */
  static formatDateString(date, format) {
    const tokens = {
      'YYYY': date.getFullYear(),
      'YY': date.getFullYear().toString().slice(-2),
      'MM': String(date.getMonth() + 1).padStart(2, '0'),
      'M': date.getMonth() + 1,
      'DD': String(date.getDate()).padStart(2, '0'),
      'D': date.getDate(),
      'HH': String(date.getHours()).padStart(2, '0'),
      'H': date.getHours(),
      'mm': String(date.getMinutes()).padStart(2, '0'),
      'm': date.getMinutes(),
      'ss': String(date.getSeconds()).padStart(2, '0'),
      's': date.getSeconds(),
      'SSS': String(date.getMilliseconds()).padStart(3, '0')
    };

    let result = format;
    for (const [token, value] of Object.entries(tokens)) {
      result = result.replace(new RegExp(token, 'g'), value);
    }
    
    return result;
  }

  /**
   * Validate configuration
   */
  static validate(config) {
    const errors = [];

    if (!config.operation) {
      errors.push('Operation is required');
    }

    if (['add', 'subtract'].includes(config.operation)) {
      if (typeof config.amount !== 'number') {
        errors.push('Amount must be a number for add/subtract operations');
      }
      if (!config.unit) {
        errors.push('Unit is required for add/subtract operations');
      }
    }

    if (config.operation === 'compare' && !config.compareDate) {
      errors.push('Compare date is required for compare operation');
    }

    if (config.operation === 'convert' && !config.targetTimezone) {
      errors.push('Target timezone is required for convert operation');
    }

    return errors;
  }

  /**
   * Get example configurations
   */
  static getExamples() {
    return {
      currentTime: {
        operation: 'now',
        format: 'YYYY-MM-DD HH:mm:ss',
        timezone: 'America/New_York'
      },
      formatDate: {
        operation: 'format',
        date: '{{inputs.created_at}}',
        format: 'DD/MM/YYYY'
      },
      addDays: {
        operation: 'add',
        date: '{{now}}',
        amount: 7,
        unit: 'days',
        format: 'YYYY-MM-DD'
      },
      compareOrder: {
        operation: 'compare',
        date: '{{steps.order.output.created_at}}',
        compareDate: '{{now}}',
        unit: 'hours'
      },
      convertTimezone: {
        operation: 'convert',
        date: '{{inputs.utc_time}}',
        targetTimezone: 'Asia/Tokyo',
        format: 'YYYY-MM-DD HH:mm:ss'
      }
    };
  }
}

export default DateTimeNode;