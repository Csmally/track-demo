/* eslint-disable */
import platform from "../../utils/platform";
import { versionCompare } from "../../utils/utils";

let trackElapseTime = 0;

export default (that: any, uniReg: RegExp) => ({
  data() {
    return {
      currentTrackKey: "",
      webviewName: "",
    };
  },
  computed: {
    vForTrackIndexClassKey(): string {
      const _this = this as any;
      const { vForTrackIndex = 0, currentTrackKey = "" } = _this;
      const path = currentTrackKey.replace(/\//g, "-");
      return `ddmc-track-observe-${path}-${vForTrackIndex}-${_this._uid}`;
    },
    isTrackPage(): boolean {
      const { currentTrackKey, $options, trackPageId } = this as any;
      return (
        (currentTrackKey && currentTrackKey.split("/").length === 1) ||
        $options.trackPage ||
        trackPageId
      );
    },
    trackVIfComputed(): Function {
      const cache: Record<string, any> = {};
      return (status: any, key: string, hash: string) => {
        const _this = this as any;
        if (status && !cache[hash]) {
          _this.$nextTick(() => {
            _this.$track(
              {
                key: `${_this.currentTrackKey}/v-if/${hash}`,
                eventType: "exposure",
              },
              _this.trackDataComputed()
            );
          });
        }
        cache[hash] = status;
        return status;
      };
    },
    trackVforIndexComputed(): number {
      const numbers = ((this as any).vForTrackIndex || "").split("-");
      return numbers.length ? numbers[numbers.length - 1] : "";
    },
  },
  created() {
    const _this = this as any;
    const currentName = _this.$options.name || "";
    let isGlobal = false;
    // 自定义组件不需要埋点上报的，直接return，避免无用的遍历操作
    // if (_this.notNeedTrackergodic) return;
    if (
      !_this.currentTrackKey &&
      !uniReg.test(currentName) &&
      !/uni/.test(_this.$options.__file)
    ) {
      if (
        !_this.$options.name &&
        _this.$options.__file &&
        _this._uid !== _this.$root._uid
      ) {
        console.error("存在组件没有name属性", this);
      }
      let parent: any = this;
      const nameParent = parent?.$parent?.$options?.name;
      const i = that.ignoreCoverageIndex.includes(nameParent)
        ? 1
        : parent?.fullCoverageTrackIndex;
      let key = `${currentName}${i ? `/${i}` : ""}`;
      while (parent.$parent) {
        const name = parent.$parent.$options.name;
        if (name && !uniReg.test(name) && name !== that.baseComponentName) {
          const nameParent = parent?.$parent?.$parent?.$options?.name;
          const index = that.ignoreCoverageIndex.includes(nameParent)
            ? 1
            : parent?.$parent?.fullCoverageTrackIndex;
          key = `${name}/${index ? `${index}/` : ""}${key}`;
        }
        if (parent.isGlobalComponent) {
          isGlobal = true;
        }
        parent = parent.$parent;
      }
      const { isGlobalComponent } = this as any;
      if (isGlobalComponent || isGlobal) {
        const keyArr = key.split("/");
        keyArr[0] = "isGlobal";
        key = keyArr.join("/");
      }
      // 某些特殊场景需要特殊过滤掉的path 避免大面积的埋点变更
      // 例如：tabbar的页面拆成组件异步化，整个页面链路多追加了一层组件name，这层name要特殊处理掉；
      that?.filterPaths?.forEach((item: string) => {
        if (key.indexOf(`/${item}/1`) > -1) {
          key = key.replace(`/${item}/1`, "");
        }
      });
      (this as any).currentTrackKey = key as string;
    }
  },
  methods: {
    trackDataComputed(data: string | undefined) {
      const _this = this as any;
      let hasParent = _this.$parent;
      const getComputed = (data: any, that: any) => {
        const computed = Object.keys(data || {});
        const computedData: Record<string, any> = {};
        if (computed.length) {
          computed.forEach((key: string) => {
            computedData[key] = that[key] === undefined ? "" : that[key];
          });
        }
        return computedData;
      };
      const getParentData = (parent: any) => ({
        ...(parent ? getComputed(parent.$options.computed, parent) : {}),
        ...(parent ? parent.$data : {}),
        ...(parent ? parent.$props : {}),
      });

      const trackParentData: any = {};
      let temp = trackParentData;
      while (hasParent) {
        if (
          hasParent?.$options?.name &&
          !uniReg.test(hasParent.$options.name) &&
          hasParent.$options.name.indexOf("pageContent") === -1
        ) {
          temp.trackParentData = getParentData(hasParent);
          temp = temp.trackParentData;
        }
        hasParent = hasParent.$parent;
      }

      return {
        vForData: data || {},
        trackParentData: trackParentData.trackParentData,
        ...getComputed(_this.$options.computed, this),
        ..._this.$data,
        ...(_this.$props || {}),
      };
    },
    // 由vue-template-click-plugin反馈回来的参数在argu中最后三个分别问
    // 1. isTrackVfor： 是否是在循环体里面 【 length - 1 】
    // 2. v-for上报的数据 【 length - 3 】
    // 3. v-for当前模块的index  【 length - 2 】
    // 4. 会返回当前的eventType，暂时只支持exposure，click
    track(
      hash: string,
      name: string,
      e: any,
      eventType = "click",
      ...argu: any[]
    ) {
      const argus = argu || [];
      let arguArr = Array.from(argus);
      const length = arguArr.length;
      const isVFor = argus[length - 1] === "isTrackVFor";
      let uploadData = {};

      // 由于uniapp可能会将数据改为小程序实例， 导致简单的深拷贝会发现问题
      try {
        uploadData =
          arguArr[length - 3] &&
          JSON.parse(JSON.stringify(arguArr[length - 3]));
      } catch (err) {
        uploadData = arguArr[length - 3];
      }

      const uploadIndex = arguArr[length - 2];
      if (isVFor) {
        arguArr = arguArr.splice(0, length - 3);
      }
      if (!arguArr.length) {
        arguArr.unshift(e);
      }
      const _this = this;
      const needExtMap = [
        "productComp",
        "NewProductComp",
        "productItem",
      ].includes((_this as any).$options.name);
      function func() {
        that.track(
          {
            key: `${(_this as any).currentTrackKey}/${hash}`,
            eventType,
            other: {
              index: isVFor ? uploadIndex : undefined,
            },
            needExtMap,
          },
          (_this as any).trackDataComputed(isVFor ? uploadData : undefined)
        );
      }
      if (platform.isApp && eventType === "click") {
        func();
      } else {
        setTimeout(() => {
          func();
        }, 50);
      }

      if (name.indexOf("=") >= 0) {
        const nameArr = name.split("=");
        const key = nameArr[0].trim();
        const value = nameArr[1].trim();
        if (!isNaN(Number(value))) {
          (this as any)[key] = Number(value);
        } else if (value === "false" || value === "true") {
          (this as any)[key] = value === "true";
        } else {
          (this as any)[key] = value;
        }
      } else {
        name && (this as any)[name.trim()]?.apply(this, arguArr);
      }
    },
    // 支持WEB_TRACKER_EXPOSURE和WEB_TRACKER_ELAPSE的全部走app曝光和消失
    highVersionTrack(_this: any, type: string) {
      // 页面曝光包括（切前台+返回曝光）
      if (type === "WEB_TRACKER_EXPOSURE") {
        _this.$track(
          {
            key: _this.currentTrackKey,
            eventType: "exposure",
          },
          _this.trackDataComputed()
        );
      }
      // 消失包括（切后台+返回+离开）
      if (type === "WEB_TRACKER_ELAPSE") {
        _this.$track(
          {
            key: _this.currentTrackKey,
            eventType: "elapse",
          },
          _this.trackDataComputed()
        );
      }
    },
    // 兼容老版本无新增bridge的情况
    lowVersionTrack(_this: any, type: string) {
      // 页面曝光，所有曝光场景
      if (type === "WEBVIEW_APPEAR") {
        _this.$track(
          {
            key: _this.currentTrackKey,
            eventType: "exposure",
          },
          _this.trackDataComputed()
        );
      }
      if (platform.isAndroid) {
        // 返回，前后台切换还走H5自己的visibilitychange
        if (type === "TAP_BACKBUTTON") {
          // if (that.referer.refer.length === 0) {
          _this.$track(
            {
              key: _this.currentTrackKey,
              eventType: "elapse",
            },
            _this.trackDataComputed()
          );
          // }
        }
      }
      // ios前后台切换单独
      if (platform.isIos) {
        // 页面消失，所有消失场景
        if (type === "WEBVIEW_DISAPPEAR") {
          _this.$track(
            {
              key: _this.currentTrackKey,
              eventType: "elapse",
            },
            _this.trackDataComputed()
          );
        }
        if (type === "APPLICATION_WILL_ENTER_FOREGROUND") {
          _this.$track(
            {
              key: _this.currentTrackKey,
              eventType: "exposure",
            },
            _this.trackDataComputed()
          );
        }
        if (type === "APPLICATION_DID_ENTER_BACKGROUND") {
          _this.$track(
            {
              key: _this.currentTrackKey,
              eventType: "elapse",
            },
            _this.trackDataComputed()
          );
        }
      }
    },
    pageElapseByNative() {
      const _this = this as any;
      if (window) {
        // const notify = (window as any)._dd_bridge_notify_ || function () {};
        (window as any)._dd_bridge_notify_sub_ = (type: string, data: any) => {
          if (versionCompare(platform.appVersion, "9.64.0") >= 0) {
            this.highVersionTrack(_this, type);
          } else {
            this.lowVersionTrack(_this, type);
          }
          // notify(type, data);
        };
      }
    },
    pageTrackDestroyed() {
      const _this = this as any;
      const hideTime = new Date().getTime();
      that.pageIsShow[_this.currentTrackKey] = false;
      if (_this.isTrackPage && that.name === "uniapp") {
        that.track(
          {
            key: _this.currentTrackKey,
            eventType: "elapse",
            other: {
              time: hideTime - trackElapseTime,
            },
          },
          (this as any).trackDataComputed()
        );
      }
    },
    pageTrackOnShow(vm: any) {
      const _this = vm || (this as any);
      const { currentTrackKey, isTrackPage } = _this;

      trackElapseTime = new Date().getTime();
      if (isTrackPage && currentTrackKey) {
        // 页面进入获取当前页面的埋点配置
        that.getConfig(currentTrackKey);
        _this.$nextTick(() => {
          if (
            that.tabs.includes(currentTrackKey) &&
            that.hidePage !== currentTrackKey && // 处理页面切入后台，再返回前台的操作
            !that.pageIsShow[currentTrackKey] && // 可能存在二级页面返回的时候，一级页面多个上报的问题
            // 二级页面返回的时候，pageBack设置为false
            (!that.referer.pageBack ||
              that.tabs.includes(that.hidePage) ||
              !that.hidePage)
          ) {
            that.pushRefer(currentTrackKey);
          }
          if (
            !that.pageIsShow[_this.currentTrackKey] &&
            that.hidePage !== currentTrackKey
          ) {
            that.pageIsShow[_this.currentTrackKey] = true;
            _this.$track(
              {
                key: currentTrackKey,
                eventType: "exposure",
              },
              _this.trackDataComputed()
            );
          }
          that.referer.pageBack = true;
        });
      }
    },
    pageTrackOnHide(vm: any) {
      const _this = vm || (this as any);
      const hideTime = new Date().getTime();
      that.pageIsShow[_this.currentTrackKey] = false;
      that.hidePage = _this.currentTrackKey;
      // 非App内的页面走这里的消失
      if (!platform.isApp || platform.isAndroid) {
        that.track(
          {
            key: _this.currentTrackKey,
            eventType: "elapse",
            other: {
              time: hideTime - trackElapseTime,
            },
          },
          _this.trackDataComputed()
        );
      }
      that.trackAllMemo();
    },
    pageTrackDomObserve(res: any) {
      const _this = this as any;
      setTimeout(() => {
        const id = res && (res.id || res.target?.id);
        if (res.intersectionRatio && id) {
          const infos = id.split("_");
          const params = infos[0].split("-");
          const key = `${_this.currentTrackKey}${
            infos[1] ? `/${infos[1]}` : ""
          }`;
          const needExtMap = [
            "productComp",
            "NewProductComp",
            "productItem",
          ].includes(_this.$options.name);
          that.pageObserveCache[_this.vForTrackIndexClassKey] = setTimeout(
            () => {
              _this.$nextTick(() => {
                _this.$track(
                  {
                    key,
                    eventType: "exposure",
                    other: {
                      index: params[1] || 0,
                    },
                    needExtMap,
                  },
                  this.trackDataComputed(_this[params[0]])
                );
              });
            },
            500
          );
        } else {
          clearTimeout(that.pageObserveCache[_this.vForTrackIndexClassKey]);
        }
      });
    },
  },
});
