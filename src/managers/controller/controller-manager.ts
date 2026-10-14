import { Vector2 } from "three/webgpu";

import { Keyboard } from "../../controller/keyboard";
import { Mouse } from "../../controller/mouse";


export enum ItemAction {
  PRIMARY,
  SECONDARY,
  TERTIARY
}

export enum PlayerAction {
  HUSTLE,
  MOVE_FORWARD,
  MOVE_BACKWARD,
  MOVE_LEFT,
  MOVE_RIGHT,
  TURN_LEFT,
  TURN_RIGHT,
}

export type ActionType = ItemAction | PlayerAction;

export function startAction (cache: ControllerManagerCache, action: ActionType): boolean {
  const wasActive = cache.activeActions.has(action);
  cache.activeActions.add(action);
  return !wasActive;
}

export function finishAction (cache: ControllerManagerCache, action: ActionType): boolean {
  for (const pointer of cache.activePointers) {
    const pointerAction = cache.pointerKeybind.get(pointer);
    if (!!pointerAction && pointerAction == action) {
      return false;
    }
  }

  for (const gamepad of cache.activeGamepads) {
    const gamepadAction = cache.gamepadKeybind.get(gamepad);
    if (!!gamepadAction && gamepadAction == action) {
      return false;
    }
  }

  for (const button of cache.activeButtons) {
    const buttonAction = cache.buttonKeybind.get(button);
    if (!!buttonAction && buttonAction == action) {
      return false;
    }
  }

  const wasActive = cache.activeActions.has(action);
  cache.activeActions.delete(action);
  return wasActive;
}


export interface ControllerManagerCache {
  pointer: Vector2;
  pointerUnit: Vector2;

  activePointers: Set<number>;
  activeGamepads: Set<number>;
  activeButtons: Set<string>;

  pointerKeybind: Map<number, ActionType>;
  gamepadKeybind: Map<number, ActionType>;
  buttonKeybind: Map<string, ActionType>;

  activeActions: Set<ActionType>;

  width: number;
  height: number;
}

export class ControllerManager {
  keyboard: Keyboard;
  mouse: Mouse;

  constructor (cache: ControllerManagerCache) {
    this.keyboard = new Keyboard(cache);
    this.mouse = new Mouse(cache);
  }
}