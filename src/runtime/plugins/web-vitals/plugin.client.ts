import { defineNuxtPlugin, useNuxtApp } from '#imports'
import { onINP, onLCP, onCLS } from 'web-vitals/attribution'
import { useHintIssues } from '../../composables/devtoolsData'
import type { ImagePerformanceData } from '../../composables/devtoolsData'
import { CLSIssueType, ImagePerformanceIssueType } from './utils'

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

export default defineNuxtPlugin({
  name: 'nuxt-hints:performance',
  setup() {
    const state = useHintIssues()
    const issues = state.imagePerformances

    function findAndPushElement(element: HTMLImageElement | HTMLElement) {
      const existingIssue = issues.value.find(issue => issue.element === element)

      if (existingIssue) {
        return existingIssue
      }

      const newIssue: ImagePerformanceData = {
        componentLocation: undefined,
        issues: [],
        element,
      }

      issues.value.push(newIssue)

      return newIssue
    }

    const nuxtApp = useNuxtApp()
    nuxtApp.hook('app:mounted', () => {
      onINP((metric) => {
        if (metric.rating === 'good') {
          return
        }
        console.info(
          '[@nuxt/hints:web-vitals] INP Metric: ',
          metric,
        )
      }, {
        reportAllChanges: true,
      })

      onLCP((metric) => {
        if (metric.rating === 'good') {
          return
        }
        console.info(
          `[@nuxt/hints:web-vitals] LCP Metric: `,
          metric,
        )

        for (const performanceEntry of metric.entries) {
          if (!performanceEntry.element || !isImgElement(performanceEntry.element)) {
            continue
          }

          if (performanceEntry.element.attributes?.getNamedItem('loading')?.value === 'lazy') {
            console.warn(
              '[@nuxt/hints:performance] LCP Element should not have `loading="lazy"` \n\n Learn more: https://web.dev/optimize-lcp/#optimize-the-priority-the-resource-is-given',
            )
            findAndPushElement(performanceEntry.element).issues.push({
              type: ImagePerformanceIssueType.LazyAttrOnLCPElement,
            })
          }
          if (hasImageFormat(performanceEntry.element.src)) {
            if (
              !performanceEntry.element.src.includes('webp')
              || !performanceEntry.element.src.includes('avif')
            ) {
              console.warn(
                '[@nuxt/hints:performance] LCP Element can be served in a next gen format like `webp` or `avif` \n\n Learn more: https://web.dev/choose-the-right-image-format/ \n\n Use: https://image.nuxt.com/usage/nuxt-img#format',
              )
              findAndPushElement(performanceEntry.element).issues.push({
                type: ImagePerformanceIssueType.ImgFormat,
              })
            }
          }
          if (performanceEntry.element.fetchPriority !== 'high') {
            console.warn(
              '[@nuxt/hints:performance] LCP Element can have `fetchPriority="high"` to load as soon as possible \n\n Learn more: https://web.dev/optimize-lcp/#optimize-the-priority-the-resource-is-given',
            )
          }
          if (
            !performanceEntry.element.attributes.getNamedItem('height')
            || !performanceEntry.element.attributes.getNamedItem('width')
          ) {
            console.warn(
              '[@nuxt/hints:performance] Images should have `width` and `height` sizes set  \n\n Learn more: https://web.dev/optimize-cls/#images-without-dimensions \n\n Use: https://image.nuxt.com/usage/nuxt-img#width-height',
            )
            findAndPushElement(performanceEntry.element).issues.push({
              type: ImagePerformanceIssueType.HeightWidthMissingOnLCPElement,
            })
          }
          if (performanceEntry.startTime > 2500) {
            console.warn(
              `[@nuxt/hints:performance] LCP Element loaded in ${performanceEntry.startTime} miliseconds. Good result is below 2500 miliseconds \n\n Learn more: https://web.dev/lcp/#what-is-a-good-lcp-score`,
            )
            findAndPushElement(performanceEntry.element).issues.push({
              type: ImagePerformanceIssueType.LoadingTooLong,
            })
          }

          if (!isElementPreloaded(performanceEntry.element.src)) {
            console.warn(

              '[@nuxt/hints:performance] LCP Element can be preloaded in `head` to improve load time \n\n Learn more: https://web.dev/optimize-lcp/#optimize-when-the-resource-is-discovered \n\n Use: https://image.nuxt.com/usage/nuxt-img#preload',
            )
            findAndPushElement(performanceEntry.element).issues.push({
              type: ImagePerformanceIssueType.PreloadMissingOnLCPElement,
            })
          }
        }
      }, {
        reportAllChanges: true,
      })

      onCLS((metric) => {
        if (metric.rating === 'good') {
          return
        }
        console.info(
          '[@nuxt/hints:web-vitals] CLS Metric: ', metric,
        )

        for (const entry of metric.entries) {
          const performanceEntry = entry

          if (!performanceEntry.sources?.[0]) return

          const sourceElement = performanceEntry.sources?.[0].node

          // Nuxt DevTools button causes small layout shift so we ignore it
          if (!sourceElement || sourceElement.parentElement?.className.includes('nuxt-devtools')) return

          console.info(
            '[@nuxt/hints:performance] Potential CLS Element: ',
            sourceElement,
          )

          if ((performanceEntry.value ?? 0) > 0.1) {
            console.warn(
              `[@nuxt/hints:performance] CLS was ${performanceEntry.value}. Good result is below 0.1 \n\n Learn more: https://web.dev/articles/cls#what-is-a-good-cls-score`,
            )
            if (isImgElement(performanceEntry.sources?.[0].node)) {
              findAndPushElement(performanceEntry.sources?.[0].node).issues.push({
                type: CLSIssueType.LayoutShiftTooBig,
              })
            }
          }

          if (
            isImgElement(sourceElement)
            && (!sourceElement.attributes.getNamedItem('height')
              || !sourceElement.attributes.getNamedItem('width'))
          ) {
            console.warn(
              '[@nuxt/hints:performance] Images should have `width` and `height` sizes set  \n\n Learn more: https://web.dev/optimize-cls/#images-without-dimensions \n\n Use: https://image.nuxt.com/usage/nuxt-img#width-height',
            )
            findAndPushElement(sourceElement).issues.push({
              type: ImagePerformanceIssueType.HeightWidthMissingOnLCPElement,
            })
          }
        }
      })
    })
  },
})

const hasImageFormat = (src: string) => {
  const imageFormats = ['avif', 'jpg', 'jpeg', 'png', 'webp']

  return imageFormats.some(format => src.includes(format))
}

const isElementPreloaded = (src: string) => {
  return Array.from(document.head.childNodes).filter(
    el =>
      el.nodeName === 'LINK'
      && (el as ElementNode).attributes.href.value === src,
  ).length
}
