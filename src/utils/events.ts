/**
 * Events utility module
 * Provides a simple EventEmitter implementation for the application
 */

export class EventEmitter {
  private events: Map<string, Array<(...args: any[]) => void>> = new Map();

  /**
   * Register an event listener
   * @param event Event name
   * @param listener Event listener function
   */
  public on(event: string, listener: (...args: any[]) => void): void {
    if (!this.events.has(event)) {
      this.events.set(event, []);
    }
    this.events.get(event)?.push(listener);
  }

  /**
   * Remove an event listener
   * @param event Event name
   * @param listener Event listener function
   */
  public off(event: string, listener: (...args: any[]) => void): void {
    const listeners = this.events.get(event);
    if (!listeners) return;

    const index = listeners.indexOf(listener);
    if (index !== -1) {
      listeners.splice(index, 1);
    }
  }

  /**
   * Emit an event
   * @param event Event name
   * @param args Event arguments
   */
  public emit(event: string, ...args: any[]): void {
    const listeners = this.events.get(event);
    if (!listeners) return;

    for (const listener of listeners) {
      try {
        listener(...args);
      } catch (error) {
        console.error(`Error in event listener for ${event}:`, error);
      }
    }
  }

  /**
   * Register a one-time event listener
   * @param event Event name
   * @param listener Event listener function
   */
  public once(event: string, listener: (...args: any[]) => void): void {
    const onceListener = (...args: any[]): void => {
      this.off(event, onceListener);
      listener(...args);
    };
    this.on(event, onceListener);
  }

  /**
   * Remove all listeners for an event
   * @param event Event name
   */
  public removeAllListeners(event?: string): void {
    if (event) {
      this.events.delete(event);
    } else {
      this.events.clear();
    }
  }

  /**
   * Get all listeners for an event
   * @param event Event name
   * @returns Array of listeners
   */
  public listeners(event: string): Array<(...args: any[]) => void> {
    return this.events.get(event) || [];
  }
}
