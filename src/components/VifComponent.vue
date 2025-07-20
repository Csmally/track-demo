<template>
  <div class="hello" @click="vifdianji(1, 2)">vIfComponent--{{ info }}</div>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
  name: 'vIfComponent',
  props: ['info'],
  methods: {
    vifdianji(a: number, b: number) {
      console.log('9898--vIfComponent', a, b)
    }
  }
});
</script>

<style scoped>
</style>
