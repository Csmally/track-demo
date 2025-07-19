/* eslint-disable */
interface JsonArrBasicType {
  type: number;
  data?: any;
}

export default class Parser {
  private plugins: Map<number, Function>;

  constructor() {
    this.plugins = new Map();
  }

  public use(type: number, callback: Function) {
    this.plugins.set(type, callback);
  }

  public useArr(plugins: { type: number; callback: Function }[]) {
    plugins.forEach((plugin) => {
      this.use(plugin.type, plugin.callback);
    });
  }

  private getPlugins(type: number): Function | undefined {
    return this.plugins.get(type);
  }

  public parse<T extends JsonArrBasicType>(
    jsonArr: T[],
    data?: any,
    callback?: Function
  ): boolean {
    for (let i = 0; i < jsonArr.length; i++) {
      const json: T = jsonArr[i];
      const plugin = this.getPlugins(json.type);
      if (plugin) {
        const params = { ...json };
        let cb = data;
        if (typeof data !== "function") {
          params.data = data;
          cb = callback;
        }
        const result = (cb as Function)(plugin(params), params);
        if (!result) {
          return false;
        }
      } else {
        return false;
      }
    }
    return true;
  }
}
