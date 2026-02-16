<script setup lang="ts">
// Direct import - this should trigger a lazy-load suggestion
// because the component is conditionally rendered
import HeavyComponent from '~/components/HeavyComponent.vue'
import { ref } from 'vue'

const showHeavy = ref(false)
</script>

<template>
  <div class="lazy-test">
    <h1>Lazy Load Test</h1>
    <p>
      This page imports HeavyComponent directly, but it's hidden behind a toggle.
      The hints module should suggest using &lt;LazyHeavyComponent&gt; instead.
    </p>

    <button @click="showHeavy = !showHeavy">
      {{ showHeavy ? 'Hide' : 'Show' }} Heavy Component
    </button>

    <HeavyComponent
      v-if="showHeavy"
      message="I was loaded eagerly but could have been lazy!"
    />
    <!-- auto import test -->
    <AnotherComponent
      v-if="showHeavy"
    />
  </div>
</template>

<style scoped>
.lazy-test {
  padding: 20px;
}

button {
  padding: 10px 20px;
  margin: 20px 0;
  cursor: pointer;
}
</style>
