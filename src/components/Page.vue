<template>
  <div>
    <HelloWorld/>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import HelloWorld from './HelloWorld.vue';

export default Vue.extend({
  name: 'myPage',
  components: {
    HelloWorld,
  },
  data() {
    return {
      arr: [1, 2, 3],
      isShow: true
    }
  },
});
</script>
