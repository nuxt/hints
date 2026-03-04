<script setup lang="ts">
const features = useEnabledHintsFeatures()
</script>

<template>
  <div class="grid grid-cols-1 md:grid-cols-3 gap-3 p-4">
    <FeatureCardsWebVitalsCard v-if="features.webVitals" />
    <FeatureCardsHydrationCard v-if="features.hydration" />
    <FeatureCardsThirdPartyScriptsCard v-if="features.thirdPartyScripts" />
    <FeatureCardsLazyLoadCard v-if="features.lazyLoad" />
    <FeatureCardsHtmlValidateCard v-if="features.htmlValidate" />
  </div>
</template>
