/**
 * MCP Server Logger
 * 
 * Simple logger utility for the MCP server
 */

/**
 * Log levels
 */
export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR'
}

/**
 * Logger options
 */
export interface LoggerOptions {
  /**
   * Minimum log level to display
   * @default LogLevel.INFO
   */
  minLevel?: LogLevel;

  /**
   * Whether to include timestamps in logs
   * @default true
   */
  timestamps?: boolean;
}

/**
 * Logger class for MCP server
 */
export class Logger {
  private minLevel: LogLevel;
  private timestamps: boolean;

  /**
   * Create a new logger
   * 
   * @param options - Logger options
   */
  constructor(options: LoggerOptions = {}) {
    this.minLevel = options.minLevel || LogLevel.INFO;
    this.timestamps = options.timestamps !== false;
  }

  /**
   * Log a debug message
   * 
   * @param message - Message to log
   * @param args - Additional arguments
   */
  debug(message: string, ...args: unknown[]): void {
    this.log(LogLevel.DEBUG, message, ...args);
  }

  /**
   * Log an info message
   * 
   * @param message - Message to log
   * @param args - Additional arguments
   */
  info(message: string, ...args: unknown[]): void {
    this.log(LogLevel.INFO, message, ...args);
  }

  /**
   * Log a warning message
   * 
   * @param message - Message to log
   * @param args - Additional arguments
   */
  warn(message: string, ...args: unknown[]): void {
    this.log(LogLevel.WARN, message, ...args);
  }

  /**
   * Log an error message
   * 
   * @param message - Message to log
   * @param args - Additional arguments
   */
  error(message: string, ...args: unknown[]): void {
    this.log(LogLevel.ERROR, message, ...args);
  }

  /**
   * Log a message with a specific level
   * 
   * @param level - Log level
   * @param message - Message to log
   * @param args - Additional arguments
   */
  private log(level: LogLevel, message: string, ...args: unknown[]): void {
    if (this.shouldLog(level)) {
      const timestamp = this.timestamps ? `[${new Date().toISOString()}] ` : '';
      const prefix = `${timestamp}[MCP ${level}] `;
      
      console.log(prefix + message, ...args);
    }
  }

  /**
   * Check if a message with the given level should be logged
   * 
   * @param level - Log level to check
   * @returns Whether the message should be logged
   */
  private shouldLog(level: LogLevel): boolean {
    const levels = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR];
    return levels.indexOf(level) >= levels.indexOf(this.minLevel);
  }
}

/**
 * Create a default logger instance
 */
export const createLogger = (options: LoggerOptions = {}): Logger => {
  return new Logger(options);
};

/**
 * Default logger instance
 */
export const logger = createLogger();
