import type { Preset } from 'unocss'
import { defineConfig, mergeDeep, presetAttributify, presetIcons, presetWind3, transformerDirectives, transformerVariantGroup } from 'unocss'
import { parseColor, theme } from 'unocss/preset-mini'

const N_PREFIX_RE = /^n-(.*)$/

export default defineConfig({
  presets: [
    presetWind3(),
    presetAttributify(),
    presetIcons({
      prefix: ['i-', ''],
      scale: 1.2,
      extraProperties: {
        'display': 'inline-block',
        'vertical-align': 'middle',
      },
    }),
    presetDevtoolsUi(),
  ],
  transformers: [
    transformerDirectives(),
    transformerVariantGroup(),
  ],
})

// Subset of the @nuxt/devtools-ui-kit preset used by the panel, kept so the look stays identical
function presetDevtoolsUi(): Preset {
  return {
    name: 'nuxt-hints:devtools-ui',
    theme: mergeDeep(theme, {
      colors: {
        brand: '#00DC82',
        primary: '#099e61',
        context: 'rgba(var(--nui-c-context),%alpha)',
      },
    }),
    rules: [
      // `n-red`, `n-green`... set the context color used by tips, badges and buttons
      [N_PREFIX_RE, ([, body], { theme }) => {
        const color = parseColor(body!, theme)
        if (color?.cssColor?.type === 'rgb' && color.cssColor.components) {
          return { '--nui-c-context': color.cssColor.components.join(',') }
        }
      }],
      ['n-disabled', { 'opacity': 0.6, 'pointer-events': 'none', 'filter': 'saturate(0)' }],
      ['n-panel-grids-light', {
        'background-image': `url("data:image/svg+xml,%0A%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' transform='scale(3)'%3E%3Crect x='0' y='0' width='100%25' height='100%25' fill='white'/%3E%3Cpath d='M 10,-2.55e-7 V 20 Z M -1.1677362e-8,10 H 20 Z' stroke-width='0.2' stroke='hsla(0, 0%25, 98%25, 1)' fill='none'/%3E%3C/svg%3E")`,
        'background-size': '40px 40px',
      }],
      ['n-panel-grids-dark', {
        'background-image': `url("data:image/svg+xml,%0A%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' transform='scale(3)'%3E%3Crect x='0' y='0' width='100%25' height='100%25' fill='hsl(0, 0%25, 8.5%25)'/%3E%3Cpath d='M 10,-2.55e-7 V 20 Z M -1.1677362e-8,10 H 20 Z' stroke-width='0.2' stroke='hsl(0, 0%25, 11.0%25)' fill='none'/%3E%3C/svg%3E")`,
        'background-size': '40px 40px',
      }],
    ],
    variants: [
      (input) => {
        const prefix = 'n-disabled:'
        if (input.startsWith(prefix)) {
          return {
            matcher: input.slice(prefix.length),
            selector: s => `[disabled] ${s}, ${s}[disabled]`,
          }
        }
      },
    ],
    shortcuts: {
      'n-bg-base': 'bg-white dark:bg-[#151515]',
      'n-bg-active': 'bg-gray:5',
      'n-border-base': 'border-gray/20',
      'n-transition': 'transition-all duration-200',
      'n-focus-base': 'ring-2 ring-context/50',
      'n-active-base': 'ring-3 ring-context/10',
      'n-card-base': 'border n-border-base rounded n-bg-base shadow-sm',
      'n-button-base': 'border n-border-base rounded shadow-sm px-1em py-0.25em inline-flex items-center gap-1 op80 !outline-none touch-manipulation',
      'n-button-hover': 'op100 !border-context text-context',
      'n-button-active': 'n-active-base bg-context/5',
      'n-icon-button': 'aspect-1/1 w-1.6em h-1.6em flex items-center justify-center rounded op50 hover:op100 hover:n-bg-active',
      'n-tip-base': 'bg-context/4 text-context px-1em py-0.4em rounded flex gap-2 items-center dark:bg-context/12',
      'n-badge-base': 'bg-context/10 text-context rounded whitespace-nowrap select-none',
      'n-badge': 'n-badge-base mx-0.5 px-1.5 py-0.5 text-xs',
      'n-loading': 'flex h-full w-full justify-center items-center',
      'n-panel-grids': 'n-panel-grids-light dark:n-panel-grids-dark',
      'n-panel-grids-center': 'n-panel-grids flex flex-col h-full gap-2 items-center justify-center',
    },
  }
}
