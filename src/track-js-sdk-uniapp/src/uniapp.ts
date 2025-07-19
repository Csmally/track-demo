/* eslint-disable */
import Vue, { VueConstructor } from "vue";
import Base, { ConstructorType } from "./base";
import { createIntersectionObserver } from "../utils/interSectionObserver";
import VueMixin from "./base/vueMixin";
import { getEleXPath } from "../utils/utils";

declare const uni: any;
declare const getCurrentPages: any;

interface uniConstructorType extends ConstructorType {
  baseComponentName?: string;
}

export class TUniapp extends Base {
  private baseComponentName: string;

  private preswitchTab: Function;

  private preredirectTo: Function;

  private isRedirect: boolean;

  private backNumber: number;

  private filterPaths: [string];

  constructor(options: uniConstructorType) {
    super(options);
    this.name = "uniapp";
    this.baseComponentName = options.baseComponentName || "app";
    this.preswitchTab = function (params: any) {};
    this.preredirectTo = function (params: any) {};
    this.isRedirect = false;
    this.backNumber = 0;
    this.filterPaths = options?.filterPaths || ([] as any);

    this.init();
  }

  protected init(): void {
    const that = this;
    // 设置跳转到tab页之前的refer相关操作
    this.preswitchTab = function (params: any) {
      that.referer.isBack = false;
      that.referer.pageBack = false;
      setTimeout(() => {
        that.referer.isBack = true;
      });
    };
    this.preredirectTo = function (params: any) {
      that.backNumber++;
      that.isRedirect = true;
    };
  }

  protected requestConfig(pageName: string): any {
    const { os, appName, appVersion } = this.options;
    const data: any = {
      os,
      app_id: appName,
      app_version: appVersion,
      page: pageName,
    };
    if (!this.options.isPro) {
      data.trial = true;
    }
    return new Promise((resolve, reject) => {
      uni.request({
        url: `${this.httpHead}//${this.configUrl}`,
        data,
        enableHttp2: true,
        async success(res: any) {
          resolve(res.data || {});
        },
        fail() {
          reject();
        },
      });
    });
  }

  protected setLocalData(
    data: any,
    key: string = this.localKey
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      if (uni) {
        uni.setStorage({
          key,
          data,
          success() {
            resolve();
          },
          fail() {
            reject();
          },
        });
      } else {
        reject();
      }
    });
  }

  protected getLocalData(key: string = this.localKey): Promise<any> {
    return new Promise((resolve, reject) => {
      if (uni) {
        uni.getStorage({
          key,
          success(res: any) {
            resolve(res.data);
          },
          fail() {
            resolve(null);
          },
        });
      } else {
        reject(new Error("uni.getStorage is not function"));
      }
    });
  }

  private resetBackNumber() {
    this.backNumber = 0;
  }

  private resetRedirectStatus() {
    this.isRedirect = false;
  }

  private resetUniRouterFunc(name: string) {
    const uniFunc = uni[name];
    const that = this;
    uni[name] = function (params: any) {
      (that as any)[`pre${name}`](params);
      uniFunc(params);
    };
  }

  private mixin(): VueConstructor {
    const that = this;
    const ignoreReg = /(VUni)|(^Page)|(pages)|(app)|(App)/;
    const cache: Record<string, any> = {};
    this.resetUniRouterFunc("switchTab");
    this.resetUniRouterFunc("redirectTo");

    return Vue.extend({
      onShow() {
        that.resetRedirectStatus();
        setTimeout(() => {
          this.pageTrackOnShow();
        }, 500);
      },
      onHide() {
        this.pageTrackOnHide();
      },
      onLoad(options: Record<string, any>) {
        setTimeout(() => {
          if (options.refererInfo) {
            try {
              const act =
                JSON.parse(decodeURIComponent(options.refererInfo)) || null;
              if (act) {
                act.page_id += "WebReferMask";
                if (that.referer.lastPage !== act.page_id) {
                  this.webviewName = act.page_id;
                  that.referer.push(act.page_id);
                }
                that.referer.pushEvent(act);
              }
            } catch (e) {
              console.error("act parse error", e);
            }
          }
          // 需要延迟500ms 等待onTabItemTap执行完成之后在执行push
          const { currentTrackKey } = this;
          if (currentTrackKey && !that.tabs.includes(currentTrackKey)) {
            that.pushRefer(currentTrackKey);
          }
        });
      },
      onTabItemTap(obj: { index: number; text: string; pagePath: string }) {
        this.$nextTick(() => {
          const lastTabPage = that.referer.getLastTabPage(that.tabs);
          if (lastTabPage && this.currentTrackKey !== lastTabPage) {
            this.$track(
              {
                key: this.currentTrackKey,
                eventType: "click",
                other: {
                  ...obj,
                  page_id: lastTabPage,
                },
              },
              this.trackDataComputed()
            );
          }
        });
      },
      destroyed() {
        this.pageTrackDestroyed();
        if (
          this.isTrackPage &&
          that.referer.pageBack &&
          !that.isRedirect &&
          // 删除 System 的一些组件（uni打入的）
          !/System/.test(this.currentTrackKey)
        ) {
          that.hidePage = this.currentTrackKey;
          // 可能会回退多个页面
          for (let i = 0; i <= that.backNumber; i++) {
            that.referer.back();
          }
          if (this.webviewName === that.referer.lastPage) {
            that.referer.back();
          }
          that.resetBackNumber();
        }
      },
      mounted() {
        const uniReg = /(VUni)|(App)|(pages)|(app)|(transition)|(AsyncLoading)/;
        const currentName = this.$options.name || "";
        if (this.isTrackPage) {
          this.pageElapseByNative();
        }
        const {
          degradeMask,
          degradeConfig = {},
          degradeTrack,
        } = (Vue.prototype as any).$store.state?.globalData || {};
        // 降级模式且开关打开情况不继续埋点
        if (degradeMask && degradeTrack && degradeConfig?.trackClose) {
          return;
        }
        if (!uniReg.test(currentName) && !this.isCloseTrackObserve) {
          let timer = 1000;
          // #ifdef MP-ALIPAY
          timer = 3000;
          // #endif
          const observe = (el: string | Element) => {
            const ob = createIntersectionObserver(
              this,
              that.options.isH5
            ).relativeToViewport({ bottom: 20 });
            if (ob) {
              ob.observe(el, (res: any) => {
                this.pageTrackDomObserve(res);
              });
            }
          };
          const pageName = this.currentTrackKey.split("/")[0];
          if (
            !that.configPaths.get(pageName) ||
            (that.configPaths.get(pageName) || []).find((path) => {
              const temp = path.split("/");
              temp.splice(-1);
              return this.currentTrackKey === temp.join("/");
            })
          ) {
            setTimeout(() => {
              try {
                if (that.options.isH5) {
                  const el = document.getElementsByClassName(
                    this.vForTrackIndexClassKey
                  );
                  if (el) {
                    Array.from(el).forEach((element: Element) => {
                      const path = getEleXPath(element) + element.innerHTML;
                      if (!cache[path]) {
                        observe(element);
                        cache[path] = 1;
                      }
                    });
                  }
                } else {
                  observe(`.${this.vForTrackIndexClassKey}`);
                }
              } catch (e) {
                console.error(e);
              }
            }, timer);
          }
        }
      },
    } as any).extend(VueMixin(that, ignoreReg));
  }

  public install(V: VueConstructor): void {
    V.prototype.$track = this.track.bind(this);
    V.mixin(this.mixin());
  }
}
