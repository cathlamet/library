import { ControllerManagerCache, finishAction, startAction } from "../managers/controller/controller-manager";
import { EventListener } from "../utils/event-listener";


const EVENT_BUTTON_DOWN = 'button.down';
const EVENT_BUTTON_UP = 'button.up';

export class Keyboard {
  cache: ControllerManagerCache;
  listener: EventListener = new EventListener();

  constructor (cache: ControllerManagerCache) {
    this.cache = cache;
  }

  register (): void {
    document.addEventListener('keydown', (event) => this.keydown(event), { passive: true });
    document.addEventListener('keyup', (event) => this.keyup(event), { passive: true });
  }

  subscribeKeyDown (callback: any): void {
    this.listener.subscribe(EVENT_BUTTON_DOWN, callback);
  }
  subscribeKeyUp (callback: any): void {
    this.listener.subscribe(EVENT_BUTTON_UP, callback);
  }

  keydown (event: KeyboardEvent): void {
    this.cache.activeButtons.add(event.key);

    const action = this.cache.buttonKeybind.get(event.key);
    if (action !== undefined && startAction(this.cache, action)) {
      this.listener.notify(EVENT_BUTTON_DOWN, action);
    }
  }

  keyup (event: KeyboardEvent): void {
    this.cache.activeButtons.delete(event.key);

    const action = this.cache.buttonKeybind.get(event.key);
    if (action !== undefined && finishAction(this.cache, action)) {
      this.listener.notify(EVENT_BUTTON_UP, action);
    }
  }

}
