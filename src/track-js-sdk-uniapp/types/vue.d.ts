/* eslint-disable */
import Vue from "vue";

declare module "vue/types/options" {
  interface ComponentOptions<V extends Vue> {
    trackPage?: boolean;
  }
}

declare module "vue/types/vue" {
  interface Vue {
    $track: (
      uploadData: Record<string, any>,
      vueData: Record<string, any>
    ) => void;
  }
}
