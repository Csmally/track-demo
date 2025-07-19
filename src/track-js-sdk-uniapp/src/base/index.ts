/* eslint-disable */
import loggerParser from "../../utils/loggerParser";
import Parser from "../../utils/parser";
import Logger from "../../helper/logger";
import Referer from "../../helper/referer";
import EventHandler from "../../helper/events";
import parsePath from "../../utils/parser/plugins/parsePath";
import { SHOULD_MONITOR_KEYS } from "../constant/index";

type actType = "click" | "exposure" | "swipe" | "elapse";

const errorEvent = "errorHandler";

// log: 实际请求的接口
// key:
// isPro: 区分开发环境跟生产环境
// env: 接口请求的当前环境
// filterPaths 需要过滤的组件name
export interface ConstructorType {
  log: Function;
  isPro?: boolean;
  env?: string;
  os?: string;
  appName?: string;
  appVersion?: string;
  isSingle?: boolean;
  isH5?: boolean;
  uploadUrl?: string;
  tabs?: string[];
  beforeUpload?: Function;
  ignoreCoverageIndex?: string[];
  errorHandler?: Function;
  filterPaths?: string[];
}

export interface AttributesType {
  name: string;
  value: string;
  type: number;
}

export interface ActionType {
  key?: string;
  path: string;
  act_type: actType;
  attributes: AttributesType[];
}

export interface PropertiesType {
  name: string;
  path: string;
  key?: string;
  value?: string;
  type: number;
}

export interface TrackType {
  key: string;
  eventType: string;
  needExtMap?: boolean;
  other?: Record<string, any>;
}

export interface EventType {
  event_id: number;
  event_version: number;
  actions: ActionType[];
  properties: PropertiesType[];
}

export interface LocalData {
  event_id: number;
  event_version: number;
  action: AttributesType[];
  properties: PropertiesType[];
  atOnce: boolean;
}

export interface LocalEventType {
  [path: string]: {
    [eventType: string]: LocalData;
  };
}

export interface EventCacheType {
  key: string;
  eventType: string;
}

export default class TrackController {
  protected options: ConstructorType;

  protected configUrl: string;

  protected isInIframe: boolean;

  protected localVersion: string;

  private loggerParser: Parser;

  private cacheConfig: Record<string, LocalEventType>;

  private logger: Logger;

  private pageIsShow: Record<string, boolean>;

  private pageIdParseCache: Record<string, string>;

  private pageObserveCache: Record<string, any>;

  private eventCache: Map<string, Set<Function>>;

  private currentPageId: string;

  private eventHandler: EventHandler;

  protected ignoreCoverageIndex: string[];

  protected tabs: string[];

  protected referer: Referer;

  protected currentKey: string;

  protected localKey: string;

  protected isSingle: boolean;

  protected hidePage: string;

  protected httpHead: string;

  protected name: string;

  protected configPaths: Map<string, string[]>;

  constructor(options: ConstructorType) {
    this.name = "";
    this.options = options;
    this.isSingle = options.isSingle === undefined ? false : options.isSingle;
    this.httpHead = "https:";
    this.configUrl = "trackerfeed.ddxq.mobi/getConfigsByPage";
    this.currentKey = "";
    this.localKey = "DDMC_TRACK_CONFIG";
    this.localVersion = "DDMC_TRACK_VERSION";
    this.loggerParser = loggerParser;
    this.ignoreCoverageIndex = options.ignoreCoverageIndex || [];
    if (window) {
      // eslint-disable-next-line eqeqeq
      this.isInIframe = window.self != window.top;
    } else {
      this.isInIframe = false;
    }
    this.logger = new Logger({
      url: options.uploadUrl,
      log: options.log,
      beforeUpload: options.beforeUpload,
    });
    this.cacheConfig = {};
    this.referer = new Referer(); // refer
    this.tabs = options.tabs || []; // 底部tabs
    this.hidePage = ""; // 上一个消失的页面
    this.pageIsShow = {}; // 页面是否展示
    this.pageIdParseCache = {}; // 获取pageId的时候做的缓存
    this.pageObserveCache = {}; // 曝光的时候的埋点上报的缓存
    this.eventCache = new Map(); // 事件存储， 如果接口没返回就不上报
    this.currentPageId = "";
    this.configPaths = new Map();
    this.eventHandler = new EventHandler();
    this.init();
    this.initSelf();
  }

  protected init() {
    // 初始化获取数据并保存
    // 请求一下全局配置的接口
    // 判断当前的版本号是否对应
    // 如果不对应则更新对应数据
    // 如果对应则没有任何操作
    // this.getConfig('online2');
  }

  private initSelf() {
    if (this.options.errorHandler) {
      this.eventHandler.addEventListener(errorEvent, this.options.errorHandler);
    }
  }

  protected async getConfig(pageName: string) {
    pageName = pageName.split("/")[0];
    if (this.cacheConfig[pageName]) {
      return this.cacheConfig[pageName];
    }
    const res: any = await this.requestConfig(pageName);
    const temp = this.configPaths.get(pageName) || [];
    if (res.success) {
      const events: EventType[] = res.data.events as any;
      const localData: LocalEventType = {};
      const instantEvents = (res.data?.instantEvents as any) || [];
      if (events?.length) {
        events.forEach((event) => {
          event.actions.forEach((action) => {
            if (this.options.isPro) {
              temp.push(action.path);
            }
            // 需要立即上报(点击类型 或 instantEvents配置下发)
            const isAtOnce =
              action.act_type === "click" ||
              instantEvents.includes(event?.event_id || "");
            localData[action.path] = {
              ...(localData[action.path] || {}),
              [action.act_type]: {
                event_id: event.event_id,
                event_version: event.event_version,
                action: action.attributes,
                properties: event.properties,
                atOnce: isAtOnce,
              },
            };
          });
        });
      }
      if (this.options.isPro) {
        this.configPaths.set(pageName, temp);
      }
      this.cacheConfig[pageName] = localData;
      this.releaseCache(pageName);
    }
  }

  protected requestConfig(pageName: string) {
    if (window?.trackPlatformConfig?.[pageName]) {
      return window?.trackPlatformConfig?.[pageName];
    }
    const { os, appName, appVersion } = this.options;
    const h = `${this.httpHead}//${this.configUrl}`;
    let url = `${h}?os=${os}&app_id=${appName}&app_version=${appVersion}&page=${
      pageName.split("/")[0]
    }`;
    if (!this.options.isPro) {
      url = `${url}&trial=true`;
    }
    return fetch(url, {
      method: "GET",
    }).then((res) => res.json());
  }

  protected async getLocalData(key: string = this.localKey): Promise<any> {
    return {};
  }

  protected async setLocalData(data: any, key?: string): Promise<void> {
    console.log(123);
  }

  private getPageId(id: string, data: any): string {
    const reg = /\$\{([\w\W]*)\}/;
    if (reg.test(id)) {
      const v = RegExp.$1;
      if (this.pageIdParseCache[v]) {
        return this.pageIdParseCache[v];
      }
      const value = parsePath({ data: { data }, value: v });
      const res = id.replace(reg, value);
      if (value) {
        this.pageIdParseCache[v] = res;
      }
      return res;
    }
    return id;
  }

  protected pushRefer(currentTrackKey: string) {
    if (!this.cacheConfig[currentTrackKey]) {
      this.setTrackCache(currentTrackKey, () => {
        this.referer.push(currentTrackKey);
      });
    } else {
      this.referer.push(currentTrackKey);
    }
  }

  // 一次性将埋点上报， 如果在接口未返回的情况
  // 还有几种情况没做
  // 1. 接口未返回，直接退出页面，埋点丢失
  // 2. 接口未返回，页面崩溃，埋点丢失
  private releaseCache(pageName: string) {
    if (this.eventCache.has(pageName)) {
      const funcs = this.eventCache.get(pageName) || new Set();
      const funcsArr = Array.from(funcs || new Set());
      funcsArr.forEach((func) => func());
      this.eventCache.delete(pageName);
    }
  }

  private setTrackCache(pageId: string, callback: Function) {
    let cache = this.eventCache.get(pageId);
    if (!cache) {
      cache = new Set();
      this.eventCache.set(pageId, cache);
    }
    cache.add(callback);
  }

  public trackAllMemo() {
    // 发送全部埋点
    this.logger.track(null, false, true);
  }

  public async track(
    params: TrackType,
    data: any = {},
    isSecendExposure?: boolean
  ): Promise<void> {
    const { eventType, other = {} } = params;
    const key = params.key;
    const keys = key.split("/");
    let pageId = keys[0];
    const isGlobal = pageId === "isGlobal";
    const isParseError = {
      status: false,
      msg: [] as string[],
      shouldMonitor: false,
    };
    if (!key) {
      return;
    }
    // 当当前的path是全局类型的path的时候，就将修改当前的path为当前的pageId
    if (isGlobal) {
      pageId = this.referer.page[0];
      // keys[0] = pageId;
      // key = keys.join('/');
    }
    const cache = {
      ...this.cacheConfig[pageId],
      ...(this.cacheConfig.APP || {}),
    };
    // 两次埋点， 一次是发送配置的， 一次是发送埋点的
    this.logger.track({
      ...params,
      event_type: params.eventType,
      data,
      isConfig: true,
      os: this.options.os || "",
      app_id: this.options.appName || "",
      app_version: this.options.appVersion || "",
      atOnce: false, // 立即上报
    });

    // 如果当时接口的数据还没有返回， 就先将埋点全部存储，接口返回后再次请求;
    if (!this.cacheConfig[pageId]) {
      // 兼容pageId为空情况 例如：异常path "/exposure"
      pageId &&
        this.setTrackCache(pageId, () => {
          this.track(params, data, isSecendExposure);
        });
      return;
    }
    if (
      this.referer.page.length &&
      key.indexOf(this.referer.page[0]) === -1 &&
      eventType !== "click" &&
      keys.length > 1 &&
      !isGlobal &&
      key.indexOf("APP") === -1
    ) {
      return;
    }
    // console.log(`${eventType}: ${key}`, this.referer.refer);
    // 添加， action，properties
    const trackParams: any = {
      event_id: 0,
      event_version: 0,
      properties: {},
      act: {
        act_type: eventType,
        path: key,
        page_id: this.getPageId(data.trackPageId || pageId, {
          ...data,
          ...other,
        }),
      },
      atOnce: false, // 立即上报
    };
    // 存在配置的情况
    if (cache && cache[key]) {
      const currentAction: LocalData = cache[key][eventType];
      if (currentAction) {
        const trackData: LocalData = currentAction;
        this.loggerParser.parse(
          trackData.action,
          {
            data,
            other,
          },
          (value: any, obj: any) => {
            if (value === undefined) {
              isParseError.status = true;
              isParseError.msg.push(obj.name);
              !isParseError.shouldMonitor &&
                (isParseError.shouldMonitor = SHOULD_MONITOR_KEYS.includes(
                  obj.name
                ));
            } else if (value !== "APP") {
              trackParams.act[obj.name] = value;
            }
            return true;
          }
        );
        this.loggerParser.parse(
          trackData.properties,
          {
            data,
            other,
          },
          (value: any, obj: any) => {
            trackParams.properties[obj.name] = value;
            if (value === undefined) {
              trackParams.properties[obj.name] = "";
              isParseError.status = true;
              isParseError.msg.push(obj.name);
              !isParseError.shouldMonitor &&
                (isParseError.shouldMonitor = SHOULD_MONITOR_KEYS.includes(
                  obj.name
                ));
            }
            return true;
          }
        );
        // 支持商卡曝光、加购、点击、手埋extmap
        if (
          (params.needExtMap && data?.trackParentData?.product?.extMap) ||
          data?.product?.extMap
        ) {
          trackParams.properties = Object.assign(
            trackParams.properties,
            data?.product?.extMap || data?.trackParentData?.product?.extMap
          );
        }
        trackParams.event_id = currentAction.event_id;
        trackParams.event_version = currentAction.event_version;
        trackParams.atOnce = currentAction?.atOnce;
      }
    }

    if (other.page_id) {
      trackParams.act.page_id = other.page_id;
    }

    if (isParseError.status) {
      // 上报
      const msg = `
eventInfo: ${JSON.stringify(trackParams)},
errorInfo: 对应的key [${isParseError.msg.toString()}] 解析存在问题
			`;
      this.eventHandler.triggered(errorEvent, {
        status: false,
        eventInfo: trackParams,
        msg,
        shouldMonitor: isParseError.shouldMonitor,
      });
    }

    if (cache && cache[key] && cache[key][eventType]) {
      const act = trackParams.act;
      const time = new Date().getTime();

      if (["click"].includes(eventType)) {
        this.referer.pushEvent({
          ...act,
          time,
          event_id: trackParams.event_id,
        });
      }
      if (eventType === "elapse") {
        this.referer.pushElapse(key);
      }

      const { appName, appVersion } = this.options;

      this.logger.track(
        {
          time,
          referer: this.referer.refer,
          app_id: appName,
          app_version: appVersion,
          ...trackParams,
          ...params,
        },
        isSecendExposure
      );
    }
  }
}
