<template>
  <div class="hello" @click="vfordianji(1, 2)">vForComponent</div>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
  name: 'vForComponent',
  methods: {
    vfordianji(a: number, b: number) {
      console.log('9898--vfordianji', a, b)
    }
  }
});
</script>

<style scoped>
</style>
