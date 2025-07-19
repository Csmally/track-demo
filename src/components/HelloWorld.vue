<template>
  <div>
    <div>普通元素</div>
    <div class="hello" @click="dianji(1, 2)">HelloWorld</div>
    <div class="box">
      <VforComponent v-for="(item, index) in arr" :key="index"/>
    </div>
    <div class="box">
      <VforComponent v-for="(item, index) in arr" :key="index"/>
    </div>
    <VifComponent v-if="isShow"/>
    <VifComponent v-if="isShow"/>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import VforComponent from './VforComponent.vue';
import VifComponent from './VifComponent.vue';



export default Vue.extend({
  name: 'HelloWorld',
  components: {
    VforComponent,
    VifComponent,
  },
  data() {
    return {
      arr: [1, 2, 3],
      isShow: true
    }
  },
  methods: {
    dianji(a: number, b: number) {
      console.log('9898--HelloWorld', a, b)
    }
  }
});
</script>

<style scoped>
.box {
  border: 2px solid red;
  margin: 10px 0;
}
</style>
