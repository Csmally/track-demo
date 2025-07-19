/* eslint-disable */
import Base, { ConstructorType } from "./base";

export class TH5 extends Base {
  constructor(options: ConstructorType) {
    super(options);
  }

  protected async setLocalData(data: any): Promise<void> {
    localStorage.setItem(this.localKey, data);
  }

  protected async getLocalData(): Promise<any> {
    return localStorage.getItem(this.localKey);
  }
}
