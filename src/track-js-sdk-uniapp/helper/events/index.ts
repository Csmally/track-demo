/* eslint-disable */
export default class EventHandler {
  private eventHandler: Map<string, Map<string, Function>>;

  constructor() {
    // eventHandler是一个二维Map
    this.eventHandler = new Map();
  }

  addEventListener(event: string, func: Function): void {
    const funcs = this.eventHandler.get(event) || new Map();
    // 不覆盖func.constructor()创建一个新的空匿名函数
    funcs.set(func.constructor(), func);
    this.eventHandler.set(event, funcs);
  }

  removeEventListener(event: string, func: Function): void {
    const funcs = this.eventHandler.get(event);
    if (funcs) {
      funcs.delete(func.constructor());
    }
  }

  triggered(event: string, params: Record<string, any>): void {
    const funcs = this.eventHandler.get(event);
    if (funcs) {
      Array.from(funcs.keys()).forEach((key) => {
        const func = funcs.get(key);
        if (func) {
          func(params);
        }
      });
    }
  }
}
