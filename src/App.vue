<template>
  <div id="app">
    <pageContent />
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import pageContent from './components/Page.vue';

export default Vue.extend({
  name: 'App',
  components: {
    pageContent
  }
});
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>
