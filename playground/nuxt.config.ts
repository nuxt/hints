export default defineNuxtConfig({
  devServer: {
    port: 7890,
  },
  modules: ["../src/module"],
  devtools: { enabled: true },
  hints: { enabled: true },
});
