/* eslint-disable */
import Vue, { VueConstructor } from "vue";
import { versionCompare, getEleXPath, isCanObserve } from "../utils/utils";

import Base, { ConstructorType } from "./base";
import VueMixin from "./base/vueMixin";
import platform from "../utils/platform";

interface VueConstructorType extends ConstructorType {
  baseComponentName?: string;
}

export class TVue extends Base {
  private baseComponentName: string;

  private deferObserveArr: Function[];

  constructor(options: VueConstructorType) {
    super(options);
    this.name = "vue";
    this.httpHead = window.location.protocol;
    this.deferObserveArr = [];
    this.baseComponentName = options.baseComponentName || "app";
  }

  protected async setLocalData(
    data: any,
    key: string = this.localKey
  ): Promise<void> {
    localStorage.setItem(key, JSON.stringify(data));
  }

  protected async getLocalData(key: string = this.localKey): Promise<any> {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : null;
  }

  private mixin(): VueConstructor {
    const that = this;
    const uniReg = /(App)|(div)|(span)/;
    const listers: Record<string, any> = {};
    let cache: Record<string, any> = {};

    const routerEnter = (vm: any) => {
      const page = that.referer.page;
      if (vm.isTrackPage) {
        const page = that.referer.page;
        if (vm.isTrackPage) {
          const trackKey = vm.currentTrackKey.split("/")[0];
          if (page.length > 1 && page[1] === trackKey) {
            that.referer.back();
          } else {
            that.referer.push(trackKey);
          }
          vm.pageTrackOnShow(vm);
        }
      }
    };
    // H5默认自己调用一下APP的config配置
    that.getConfig("APP");
    const vueRouter: any = {
      beforeRouteEnter(to: string, from: string, next: any) {
        next((vm: any) => {
          vm.isRouterEnter = true;
          !platform.isApp && routerEnter(vm);
        });
      },
      beforeRouteLeave(to: string, from: string, next: any) {
        if (this.isTrackPage) {
          this.pageTrackOnHide();
        }
        next();
      },
    };

    const options: any = {
      mounted() {
        const timer = 1000;
        const { currentTrackKey } = this;
        // 页面消失上报埋点, 基于app的消失判断
        // App内的H5页面曝光也都走这里
        if (this.$options.trackPage) {
          this.pageElapseByNative();
        }
        // 多页面应用，在这边请求页面配置
        if (!that.isSingle && this.$options.trackPage) {
          that.getConfig(currentTrackKey);
          setTimeout(() => {
            this.$track(
              {
                key: currentTrackKey,
                eventType: "exposure",
              },
              this.trackDataComputed()
            );
          });
        }
        // 单页面应用，且是App内的H5走这里上报首次进入页面的曝光
        if (
          platform.isApp &&
          this.$options.trackPage &&
          that.options.isSingle &&
          this.isRouterEnter
        ) {
          routerEnter(this);
        }
        // 如果是单页，并且不触发beforeRouter的时候的兜底方案
        if (
          this.$options.trackPage &&
          that.options.isSingle &&
          !this.isRouterEnter
        ) {
          routerEnter(this);
        }
        // 如果是页面，添加曝光跟隐藏的捕获
        if (!platform.isIos && this.isTrackPage && !listers[currentTrackKey]) {
          if (
            platform.isAndroid &&
            versionCompare(platform.appVersion, "9.64.0") >= 0
          )
            return;
          listers[currentTrackKey] = () => {
            if (
              this.isTrackPage &&
              (this.currentTrackKey.split("/")[0] === that.referer.page[0] ||
                !that.referer.page[0])
            ) {
              if (document.visibilityState === "hidden") {
                this.pageTrackOnHide();
              } else if (
                that.hidePage &&
                that.hidePage === this.currentTrackKey &&
                !platform.isAndroid
              ) {
                this.$track(
                  {
                    key: currentTrackKey,
                    eventType: "exposure",
                  },
                  this.trackDataComputed()
                );
              }
            }
          };
          document.addEventListener(
            "visibilitychange",
            listers[currentTrackKey]
          );
        }
        // 设置监听的内容
        const ob = new IntersectionObserver(
          (entries) => {
            entries.forEach((r) => {
              if (!(that.ignoreCoverageIndex.length && !r.intersectionRatio)) {
                this.pageTrackDomObserve(r);
              }
            });
          },
          {
            rootMargin: "0px",
          }
        );

        const pageName = this.currentTrackKey.split("/")[0];
        if (
          !that.configPaths.get(pageName) ||
          (that.configPaths.get(pageName) || []).find((path) => {
            const temp = path.split("/");
            temp.splice(-1);
            return this.currentTrackKey === temp.join("/");
          })
        ) {
          const observe = () => {
            const els = Array.from(
              document.getElementsByClassName(`${this.vForTrackIndexClassKey}`)
            );
            els.forEach((el) => {
              const path = getEleXPath(el) + el.innerHTML;
              if (!cache[path]) {
                ob.observe(el);
                cache[path] = 1;
              }
            });
          };
          // 添加埋点的监听
          setTimeout(() => {
            if (isCanObserve(this)) {
              observe();
            } else {
              that.deferObserveArr.push(observe);
            }
          }, timer);
        }
      },
      beforeDestroy() {
        if (this.isTrackPage) {
          cache = {};
        }
        this.pageTrackDestroyed();
      },
    };

    return {
      ...options,
      ...(that.isSingle ? vueRouter : {}),
      ...VueMixin(that, uniReg),
    };
  }

  public install(V: VueConstructor, Route: any): void {
    V.prototype.$track = this.track.bind(this);
    V.mixin(this.mixin());
  }
}
