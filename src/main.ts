import Vue from "vue";
import App from "./App.vue";
import { LoggerController } from "./utils/logger";

Vue.config.productionTip = false;
const logger = new LoggerController();
Vue.prototype.$logger = logger;

Vue.mixin({
  methods: {
    glocalFunc() {
      console.log("9898-glocalFunc-方法");
    },
  },
});

new Vue({
  render: (h) => h(App),
}).$mount("#app");
