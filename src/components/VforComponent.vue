<template>
  <div class="hello" @click="vfordianji(1, 2)">vForComponent--{{ msg }}</div>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
  name: 'vForComponent',
  props: ['msg'],
  methods: {
    vfordianji(a: number, b: number) {
      console.log('9898--vfordianji', a, b)
    }
  }
});
</script>

<style scoped>
</style>
