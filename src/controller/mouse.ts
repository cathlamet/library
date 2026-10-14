import { ControllerManagerCache, finishAction, startAction } from "../managers/controller/controller-manager";
import { EventListener } from "../utils/event-listener";

const EVENT_POINTER_MOVE = 'pointer.move';
const EVENT_POINTER_DOWN = 'pointer.down';
const EVENT_POINTER_UP = 'pointer.up';

export class Mouse {
  cache: ControllerManagerCache;
  listener: EventListener;

  constructor (cache: ControllerManagerCache) {
    this.cache = cache;
    this.listener = new EventListener();
  }

  register (element: Element): void {
    element.addEventListener('contextmenu', (event: any) => event.preventDefault());
    element.addEventListener('wheel', (event: any) => this.wheel(event), { passive: true });
    element.addEventListener('pointermove', (event: any) => this.pointerMove(event), { passive: true });
    element.addEventListener('pointerdown', (event: any) => this.pointerDown(event), { passive: true });
    element.addEventListener('pointerup', (event: any) => this.ponterUp(event), { passive: true });
    element.addEventListener('pointerout', (event: any) => this.ponterUp(event), { passive: true });
  }

  subscribeMouseWheel (callback: any): void {
    this.listener.subscribe('mouse.wheel', callback);
  }
  subscribePointerMove (callback: any): void {
    this.listener.subscribe(EVENT_POINTER_MOVE, callback);
  }
  subscribePointerDown (callback: any): void {
    this.listener.subscribe(EVENT_POINTER_DOWN, callback);
  }
  subscribePointerUp (callback: any): void {
    this.listener.subscribe(EVENT_POINTER_UP, callback);
  }

  wheel (event: any): void {
    const delta = Math.max(-1, Math.min(1, (event.wheelDelta ?? -event.detail)));
    if (delta !== 0) {
      this.listener.notify('mouse.wheel', delta);
    }
  }

  pointerMove (event: PointerEvent): void {
    this.cache.pointer.x = event.clientX;
    this.cache.pointer.y = event.clientY;
    this.cache.pointerUnit.x = (event.clientX / this.cache.width) * 2 - 1;
    this.cache.pointerUnit.y = -(event.clientY / this.cache.height) * 2 + 1;
    this.listener.notify(EVENT_POINTER_MOVE);
  }

  pointerDown (event: PointerEvent): void {
    this.cache.activePointers.add(event.button);

    const action = this.cache.pointerKeybind.get(event.button);
    if (action !== undefined && startAction(this.cache, action)) {
      this.listener.notify(EVENT_POINTER_DOWN, action);
    }
  }

  ponterUp (event: PointerEvent): void {
    this.cache.activePointers.delete(event.button);

    const action = this.cache.pointerKeybind.get(event.button);
    if (action !== undefined && finishAction(this.cache, action)) {
      this.listener.notify(EVENT_POINTER_UP, action);
    }
  }
}
