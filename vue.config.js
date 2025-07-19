const { defineConfig } = require("@vue/cli-service");
const path = require("path");

module.exports = defineConfig({
  transpileDependencies: true,
  chainWebpack: (config) => {
    config.module
      .rule("vue")
      .use("@ddmc/vue-template-loader")
      .loader("@ddmc/vue-template-loader")
      .options({
        options: {
          headExposureIgnoreTags: ["PopUp"],
          entry: "App.vue",
        },
      })
      .after("vue-loader")
      .end();
  },
});
