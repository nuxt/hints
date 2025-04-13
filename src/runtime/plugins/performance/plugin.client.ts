import { defineNuxtPlugin } from '#imports'

type ElementNode = ChildNode & { attributes: { href: { value: string } } }

declare global {
  interface PerformanceEntry {
    element?: HTMLElement
  }
}

function isImgElement(
  element: HTMLElement,
): element is HTMLImageElement {
  return element.tagName === 'IMG'
}

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.hook('app:mounted', () => {
    new PerformanceObserver((entryList) => {
      for (const entry of entryList.getEntries()) {
        const performanceEntry = entry

        console.info(
          '[@nuxt/hints:performance] Potential LCP Element: ',
          performanceEntry,
        )

        // If element is not an image, stop execution
        if (!performanceEntry.element || !isImgElement(performanceEntry.element)) return

        if (performanceEntry.element.attributes?.getNamedItem('loading')?.value === 'lazy') {
          console.warn(
            '[@nuxt/hints:performance] LCP Element should not have `loading="lazy"` \n\n Learn more: https://web.dev/optimize-lcp/#optimize-the-priority-the-resource-is-given',
          )
        }
        if (hasImageFormat(performanceEntry.element.src)) {
          if (
            !performanceEntry.element.src.includes('webp')
            || !performanceEntry.element.src.includes('avif')
          ) {
            console.warn(
              '[@nuxt/hints:performance] LCP Element can be served in a next gen format like `webp` or `avif` \n\n Learn more: https://web.dev/choose-the-right-image-format/ \n\n Use: https://image.nuxt.com/usage/nuxt-img#format',
            )
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
        }
        if (performanceEntry.startTime > 2500) {
          console.warn(
            `[@nuxt/hints:performance] LCP Element loaded in ${performanceEntry.startTime} miliseconds. Good result is below 2500 miliseconds \n\n Learn more: https://web.dev/lcp/#what-is-a-good-lcp-score`,
          )
        }

        if (!isElementPreloaded(performanceEntry.element.src)) {
          console.warn(

            '[@nuxt/hints:performance] LCP Element can be preloaded in `head` to improve load time \n\n Learn more: https://web.dev/optimize-lcp/#optimize-when-the-resource-is-discovered \n\n Use: https://image.nuxt.com/usage/nuxt-img#preload',
          )
        }
      }
    }).observe({ type: 'largest-contentful-paint', buffered: true })
  })
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
