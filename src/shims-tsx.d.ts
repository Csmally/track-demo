import Vue, { VNode } from "vue";

declare global {
  namespace JSX {
    interface Element extends VNode {}
    interface ElementClass extends Vue {}
    interface IntrinsicElements {
      [elem: string]: any;
    }
  }
}

declare global {
  interface Window {
    ddmcBridge: TDDmcBridge;
    trackPlatformConfig: Record<string, any>;
    html2canvas: any;
  }
}
