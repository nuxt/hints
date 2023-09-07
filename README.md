# WIP Nuxt Hints

[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]
[![License][license-src]][license-href]
[![Nuxt][nuxt-src]][nuxt-href]

Nuxt module that shows hints for aspects of your application such as Performance, A11Y, Security, and more!

- [✨ &nbsp;Release Notes](/CHANGELOG.md)
  <!-- - [🏀 Online playground](https://stackblitz.com/github/your-org/@nuxt/hints?file=playground%2Fapp.vue) -->
  <!-- - [📖 &nbsp;Documentation](https://example.com) -->

## Features

<!-- Highlight some of the features your module provide here -->

- ⛰ &nbsp;Foo
- 🚠 &nbsp;Bar
- 🌲 &nbsp;Baz

## Background

https://github.com/nuxt/image/pull/763

1. Lazy loading LCP element with `loading="lazy"` attribute
2. Not using modern light image formats such as `webp`
3. Not using `fetchPriority="high"`
4. Not having `width` and `height` attributes set (bad for both LCP and CLS)
5. LCP loading in more than 2500 miliseconds
6. Not preloading the LCP element

## How it works?

The plugin is using [Performance Observer API](https://developer.mozilla.org/en-US/docs/Web/API/PerformanceObserver) under the hood to find the potential LCP element and measure metric values such as load time.

Later on, a set of statements is checking whether this LCP element matches the good practices and follows the [Optimize LCP document](https://web.dev/optimize-lcp/) values and recommendations. If not, warnings are displayed in the browser that would allow users to faster find performance bottlenecks and issues. Screenshot below for reference:

<img width="997" alt="Screenshot 2023-03-04 at 11 50 48" src="https://user-images.githubusercontent.com/37120330/222896555-0f4cfc8b-3b61-4fa1-93ec-849a9216c67a.png">

## Todo

- Write documentation about this feature
- Add other Performance hints
- Add A11Y hints based on Axe
- Add Security hints based on NuxtSecurity (OWASP, Helmet, etc)

## Next steps

Keep in mind that this PR is just beginning of the hints that we can show to the users that would allow them to have a better performing website (and improve Lighthouse and Core Web Vitals score).

I have been thinking about developing a functionality that would fix these kind of issues automatically (something like fontaine plugin) but I failed because there is no way to detect LCP programatically (without access to browser) but maybe someone else here would have some interesting ideas for that.

## Quick Setup

1. Add `@nuxt/hints` dependency to your project

```bash
# Using pnpm
pnpm add -D @nuxt/hints

# Using yarn
yarn add --dev @nuxt/hints

# Using npm
npm install --save-dev @nuxt/hints
```

2. Add `@nuxt/hints` to the `modules` section of `nuxt.config.ts`

```js
export default defineNuxtConfig({
  modules: ["@nuxt/hints"],
});
```

That's it! You can now use Nuxt Hints in your Nuxt app ✨

## Development

```bash
# Install dependencies
npm install

# Generate type stubs
npm run dev:prepare

# Develop with the playground
npm run dev

# Build the playground
npm run dev:build

# Run ESLint
npm run lint

# Run Vitest
npm run test
npm run test:watch

# Release new version
npm run release
```

<!-- Badges -->

[npm-version-src]: https://img.shields.io/npm/v/@nuxt/hints/latest.svg?style=flat&colorA=18181B&colorB=28CF8D
[npm-version-href]: https://npmjs.com/package/@nuxt/hints
[npm-downloads-src]: https://img.shields.io/npm/dm/@nuxt/hints.svg?style=flat&colorA=18181B&colorB=28CF8D
[npm-downloads-href]: https://npmjs.com/package/@nuxt/hints
[license-src]: https://img.shields.io/npm/l/@nuxt/hints.svg?style=flat&colorA=18181B&colorB=28CF8D
[license-href]: https://npmjs.com/package/@nuxt/hints
[nuxt-src]: https://img.shields.io/badge/Nuxt-18181B?logo=nuxt.js
[nuxt-href]: https://nuxt.com
