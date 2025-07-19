/* eslint-disable */
import qs from "qs";

interface OptionsType {
  log?: Function;
  beforeUpload?: Function;
  url?: string;
}

export default class Logger {
  private options: OptionsType;

  private url: string;

  private log: Function | undefined;

  private beforeUpload: Function | undefined;

  constructor(options: OptionsType) {
    this.options = options;
    this.log = options.log;
    this.beforeUpload = options.beforeUpload;
    this.url = options.url || "https://collect.t.dingdongxiaoqu.com/";
  }

  public async track(
    params: any,
    isSecendExposure?: boolean,
    uploadAll?: boolean
  ) {
    if (this.log) {
      this.log(params, isSecendExposure, uploadAll);
      return;
    }
    let p = {};
    if (this.beforeUpload) {
      p = this.beforeUpload(params, isSecendExposure);
    }
    new Image().src = `${this.url}i.png?${qs.stringify({ ...p, ...params })}`;
  }
}
