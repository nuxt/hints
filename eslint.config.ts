import withNuxt from './playground/.nuxt/eslint.config.mjs'

export default withNuxt({
  rules: {
    'vue/multi-word-component-names': 'off',
    'vue/require-v-for-key': 'off',
    'vue/valid-v-for': 'off',
  },
})
