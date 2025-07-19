import Vue from "vue";
import { TUniapp } from "../track-js-sdk-uniapp/index";

const myFetch = (data: any) => {
  fetch("http://localhost:7070/trackUpload", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  })
    .then((res) => res.json())
    .then((data) => {
      console.log("9898-track-res", data);
    })
    .catch((err) => {
      console.error("9898-track-error", err);
    });
};

export class LoggerController {
  public trackController: TUniapp;

  private cache: Map<string, boolean> = new Map();

  public logger: any;

  /** JSDoc */
  public constructor() {
    this.trackController = new TUniapp({
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      log: myFetch,
      // baseComponentName: 'APP',
      tabs: ["homePage", "cartPage", "myVipPage", "categoryPage", "minePage"],
      filterPaths: ["AsyncTabBarMine", "AsyncTabBarCate"],
      isPro: false,
      os: "4",
      appName: "ddmc",
      appVersion: "12.2.0",
      isH5: true,
      env: "",
    });
    Vue.use(this.trackController as any);
  }

  public async beforeUpload(params: any) {
    console.log("9898--图片上报");
  }

  public collect(params: object, isSecendExposure?: boolean): void {
    // 空函数 后续check去除
  }
}
