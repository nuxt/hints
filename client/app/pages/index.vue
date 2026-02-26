<script setup lang="ts">
const { features } = useHintsConfig()
</script>

<template>
  <div class="grid grid-cols-1 md:grid-cols-3 gap-3 p-4">
    <FeatureCardsWebVitalsCard v-if="features.webVitals?.devtools" />
    <FeatureCardsHydrationCard v-if="features.hydration?.devtools" />
    <FeatureCardsThirdPartyScriptsCard v-if="features.thirdPartyScripts?.devtools" />
    <FeatureCardsLazyLoadCard v-if="features.lazyLoad?.devtools" />
  </div>
</template>
