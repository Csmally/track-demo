/* eslint-disable */
import Vue from "vue";

declare const uni: any;

export type CreateIntersectionObserver = (self: Vue, options?: any) => any;
export type ObserveResult = {
  /** 相交比例 */
  intersectionRatio?: number;

  /** 相交区域的边界 */
  intersectionRect?: any;

  /* * 目标节点布局区域的边界 */
  boundingClientRect?: any;

  /** 参照区域的边界 */
  relativeRect?: any;

  /* * 相交检测时的时间戳 */
  time?: number;

  /** 元素id */
  id?: any;

  /** datase */
  dataset?: { [k: string]: any };
};

/** 扩展（或收缩）参照节点布局区域的边界 */
type Margins = {
  /** 节点布局区域的左边界 */
  left?: number;
  /** 节点布局区域的右边界 */
  right?: number;
  /** 节点布局区域的上边界 */
  top?: number;
  /** 节点布局区域的下边界 */
  bottom?: number;
};
export interface IntersectionObserver {
  /** 使用选择器指定一个节点，作为参照区域之一 */
  relativeTo(selector?: string, margins?: Margins): IntersectionObserver;

  /** 指定页面显示区域作为参照区域之一 */
  relativeToViewport(margins?: Margins): IntersectionObserver;

  /** 指定目标节点并开始监听相交状态变化情况 */
  observe(
    targetSelector?: string,
    callback?: (result: ObserveResult) => void
  ): void;

  /** * 停止监听 */
  disconnect(): void;
}

export interface IntersectionObserverH5 {
  currentObserve: any;
  cb: WeakMap<Element, Function>;
  relativeTo(selector: string, margins?: Margins): any;
  relativeToViewport(margins?: Margins): any;
  observe(selector: string, callback: Function): void;
  disconnect(): void;
}

const createIntersectionObserverMini = (self: Vue, options?: any) => {
  const createObserver = uni.createIntersectionObserver as any;
  return createObserver(self, {
    ...options,
    observeAll: true,
    // #ifdef MP-WEIXIN
    nativeMode: true,
    // #endif
  }) as IntersectionObserver;
};

const createIntersectionObserverH5 = (self: Vue, options?: any) => {
  let ob: any = null;

  const getElement = (selector: string) => {
    let root = null;
    const selet = selector.substr(1, selector.length);
    switch (selector[0]) {
      case "#":
        root = document.getElementById(selet);
        break;
      case ".":
        root = Array.from(document.getElementsByClassName(selet))[0];
        break;
      default:
        root = null;
    }
    return root;
  };

  const createObserver = (margins?: Margins, selector?: string): any => {
    let root = null;
    const m = margins || ({} as Margins);
    if (selector) {
      root = getElement(selector);
    }

    return new IntersectionObserver(
      (r) => {
        const callback = ob.cb.get(r[0].target);
        callback && callback(r[0]);
      },
      {
        root,
        rootMargin: `${m.top || 0}px ${m.right || 0}px ${m.bottom || 0}px ${
          m.left || 0
        }px`,
      }
    );
  };

  ob = {
    currentObserve: null,
    cb: new WeakMap(),
    relativeTo(selector: string, margins?: Margins) {
      this.currentObserve = createObserver(margins, selector);
      return this;
    },
    relativeToViewport(margins?: Margins) {
      this.currentObserve = createObserver(margins);
      return this;
    },
    observe(selector: string, callback: Function) {
      let el: any = selector;
      if (typeof el === "string") {
        el = getElement(selector);
      }
      if (el) {
        this.currentObserve.observe(el);
        this.cb.set(el, callback);
      }
    },
    disconnect() {
      this.currentObserve.disconnect();
    },
  };

  return ob;
};

export function createIntersectionObserver(self: Vue, isH5 = true) {
  if (isH5) {
    return createIntersectionObserverH5(self);
  }
  return createIntersectionObserverMini(self);
}
