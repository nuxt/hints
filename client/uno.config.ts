import { defineConfig, presetAttributify, presetWind3, transformerDirectives } from 'unocss'

export default defineConfig({
  presets: [
    presetWind3(),
    presetAttributify(),
  ],
  transformers: [
    transformerDirectives(),
  ],
  shortcuts: {
    'border-base': 'border-neutral-200 dark:border-neutral-800',
    'n-border-base': 'border-base',
    'n-bg-base': 'bg-white dark:bg-[#151515]',
    'n-transition': 'transition-all duration-200',
  },
  preflights: [
    {
      getCSS: () => `
        html, body { margin: 0; font-family: ui-sans-serif, system-ui, sans-serif; }
        html { color-scheme: light; }
        html.dark { color-scheme: dark; }
      `,
    },
  ],
})
