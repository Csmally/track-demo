<template>
  <div class="hello" @click="vifdianji(1, 2)">vIfComponent</div>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
  name: 'vIfComponent',
  methods: {
    vifdianji(a: number, b: number) {
      console.log('9898--vIfComponent', a, b)
    }
  }
});
</script>

<style scoped>
</style>
