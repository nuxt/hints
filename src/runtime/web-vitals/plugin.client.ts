import { defineNuxtPlugin, useNuxtApp } from '#imports'
import { onINP, onLCP, onCLS } from 'web-vitals/attribution'
import { defu } from 'defu'
import { shallowRef } from 'vue'
import { logger } from './utils'
import { getFeatureOptions } from '../core/features'

type ElementNode = ChildNode & { attributes: { href: { value: string } } }

declare global {
  interface PerformanceEntry {
    element?: HTMLElement
    sources?: {
      node: HTMLElement
      currentRect: DOMRect
      previousRect: DOMRect
    }[]
    value?: number
  }
}

function isImgElement(
  element: unknown,
): element is HTMLImageElement {
  return element instanceof Element && element.tagName === 'IMG'
}

function isIgnoredDomain(src: string, ignoreDomains: string[]): boolean {
  if (ignoreDomains.length === 0) return false
  try {
    const url = new URL(src)
    return ignoreDomains.some(domain => url.hostname === domain || url.hostname.endsWith(`.${domain}`))
  }
  catch {
    return false
  }
}

export default defineNuxtPlugin({
  name: 'nuxt-hints:performance',
  setup() {
    const nuxtApp = useNuxtApp()
    const opts = getFeatureOptions('webVitals') ?? {}
    const trackedMetrics = opts.trackedMetrics ?? ['LCP', 'INP', 'CLS']
    const ignoreDomains = opts.ignoreDomains ?? []

    nuxtApp.payload.__hints = defu(nuxtApp.payload.__hints, {
      webvitals: {
        lcp: shallowRef([]),
        inp: shallowRef([]),
        cls: shallowRef([]),
      },
    })

    nuxtApp.hook('hints:webvitals:sync', (webvitals) => {
      webvitals.lcp.value = [...nuxtApp.payload.__hints.webvitals.lcp.value]
      webvitals.inp.value = [...nuxtApp.payload.__hints.webvitals.inp.value]
      webvitals.cls.value = [...nuxtApp.payload.__hints.webvitals.cls.value]
    })

    nuxtApp.hook('app:mounted', () => {
      if (trackedMetrics.includes('INP')) {
        onINP((metric) => {
          if (metric.rating === 'good') {
            return
          }
          logger.info(
            '[web-vitals] INP Metric: ',
            metric,
          )
          nuxtApp.payload.__hints.webvitals.inp.value.push(metric)
          nuxtApp.callHook('hints:webvitals:inp', metric)
        }, {
          reportAllChanges: true,
        })
      }

      if (trackedMetrics.includes('LCP')) {
        onLCP((metric) => {
          if (metric.rating === 'good') {
            return
          }
          logger.info(
            `[web-vitals] LCP Metric: `,
            metric,
          )
          nuxtApp.payload.__hints.webvitals.lcp.value.push(metric)
          nuxtApp.callHook('hints:webvitals:lcp', metric)

          for (const performanceEntry of metric.entries) {
            if (!performanceEntry.element || !isImgElement(performanceEntry.element)) {
              continue
            }

            if (isIgnoredDomain(performanceEntry.element.src, ignoreDomains)) {
              continue
            }

            if (performanceEntry.element.attributes?.getNamedItem('loading')?.value === 'lazy') {
              logger.warn(
                '[performance] LCP Element should not have `loading="lazy"` \n\n Learn more: https://web.dev/optimize-lcp/#optimize-the-priority-the-resource-is-given',
              )
            }
            if (hasImageFormat(performanceEntry.element.src)) {
              if (
                !performanceEntry.element.src.includes('webp')
                && !performanceEntry.element.src.includes('avif')
              ) {
                logger.warn(
                  '[performance] LCP Element can be served in a next gen format like `webp` or `avif` \n\n Learn more: https://web.dev/choose-the-right-image-format/ \n\n Use: https://image.nuxt.com/usage/nuxt-img#format',
                )
              }
            }
            if (performanceEntry.element.fetchPriority !== 'high') {
              logger.warn(
                '[performance] LCP Element can have `fetchPriority="high"` to load as soon as possible \n\n Learn more: https://web.dev/optimize-lcp/#optimize-the-priority-the-resource-is-given',
              )
            }
            if (
              !performanceEntry.element.hasAttribute('width')
              || !performanceEntry.element.hasAttribute('height')
            ) {
              logger.warn(
                '[performance] Images should have `width` and `height` sizes set  \n\n Learn more: https://web.dev/optimize-cls/#images-without-dimensions \n\n Use: https://image.nuxt.com/usage/nuxt-img#width-height',
              )
            }
            if (performanceEntry.startTime > 2500) {
              logger.warn(
                `[performance] LCP Element loaded in ${performanceEntry.startTime} miliseconds. Good result is below 2500 miliseconds \n\n Learn more: https://web.dev/lcp/#what-is-a-good-lcp-score`,
              )
            }

            if (!isElementPreloaded(performanceEntry.element.src)) {
              logger.warn(
                '[performance] LCP Element can be preloaded in `head` to improve load time \n\n Learn more: https://web.dev/optimize-lcp/#optimize-when-the-resource-is-discovered \n\n Use: https://image.nuxt.com/usage/nuxt-img#preload',
              )
            }
          }
        }, {
          reportAllChanges: true,
        })
      }

      if (trackedMetrics.includes('CLS')) {
        onCLS((metric) => {
          if (metric.rating === 'good') {
            return
          }
          logger.info(
            '[web-vitals] CLS Metric: ', metric,
          )
          nuxtApp.callHook(
            'hints:webvitals:cls',
            metric,
          )
          // Push the metric as-is; components will access entries[0] directly for element
          nuxtApp.payload.__hints.webvitals.cls.value.push(metric)

          for (const entry of metric.entries) {
            const performanceEntry = entry

            if (!performanceEntry.sources?.[0]) continue

            const sourceElement = performanceEntry.sources?.[0].node

            // Nuxt DevTools button causes small layout shift so we ignore it
            if (!sourceElement || sourceElement.parentElement?.className.includes('nuxt-devtools')) continue

            logger.info(
              '[performance] Potential CLS Element: ',
              sourceElement,
            )

            if ((performanceEntry.value ?? 0) > 0.1) {
              logger.warn(
                `[performance] CLS was ${performanceEntry.value}. Good result is below 0.1 \n\n Learn more: https://web.dev/articles/cls#what-is-a-good-cls-score`,
              )
            }

            if (
              isImgElement(sourceElement)
              && (!sourceElement.attributes.getNamedItem('height')
                || !sourceElement.attributes.getNamedItem('width'))
            ) {
              logger.warn(
                '[performance] Images should have `width` and `height` sizes set  \n\n Learn more: https://web.dev/optimize-cls/#images-without-dimensions \n\n Use: https://image.nuxt.com/usage/nuxt-img#width-height',
              )
            }
          }
        }, {
          reportAllChanges: true,
        })
      }
    })
  },
})

const IMAGE_FORMATS = ['avif', 'jpg', 'jpeg', 'png', 'webp']

const hasImageFormat = (src: string) => {
  let pathname: string
  try {
    pathname = new URL(src, window.location.href).pathname
  }
  catch {
    pathname = src
  }
  return IMAGE_FORMATS.some(format => pathname.includes(format))
}

const isElementPreloaded = (src: string) => {
  return Array.from(document.head.childNodes).filter(
    el =>
      el.nodeName === 'LINK'
      && (el as ElementNode).attributes.href.value === src,
  ).length
}
