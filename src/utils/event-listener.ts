
export class EventListener {
  listeners: Map<string, any> = new Map();

  subscribe (type: string, callback: any | undefined) {
    if (typeof callback !== 'function') {
      throw new Error('Callback must be a method');
    }
    if (!this.listeners.has(type)) {
      this.listeners.set(type, []);
    }
    this.listeners.get(type).push(callback);
  }

  notify (type: string, callbackData: any | undefined = undefined) {
    setTimeout(() => {
      for (const listener of this.listeners.get(type) ?? []) {
        setTimeout(() => listener(callbackData), 0);
      }
    }, 1);
  }
}
