# Nuxt Hints

[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]
[![License][license-src]][license-href]
[![Nuxt][nuxt-src]][nuxt-href]

Easily detect Performance, Hydration, and Security issues in your Nuxt application !

- [✨ &nbsp;Release Notes](/CHANGELOG.md)

## Features

### 🚀 **Performance Analysis**
- **LCP (Largest Contentful Paint) Optimization**: Identifies images that could benefit from modern formats (WebP, AVIF), proper sizing, fetch priority, and preloading
- **CLS (Cumulative Layout Shift) Detection**: Warns about layout shifts caused by images without dimensions
- **Loading Performance**: Tracks and reports slow-loading elements (>2.5s)
- **Image Best Practices**: Validates proper `width`, `height`, `loading`, and `fetchPriority` attributes

### 📦 **Third-Party Script Monitoring**
- **Script Detection**: Automatically identifies third-party scripts on your pages
- **Performance Tracking**: Measures load times for external scripts with detailed timing breakdowns
- **Security Recommendations**: Suggests adding `crossorigin="anonymous"` for better security and error reporting
- **@nuxt/scripts Integration**: Recommends using `@nuxt/scripts` for better third-party script management

### 💧 **Hydration Insights**
- **SSR/Client Mismatch Detection**: Helps identify hydration issues between server and client rendering

### 🛠️ **Developer Experience**
- **Nuxt DevTools Integration**: Rich UI for visualizing performance issues and recommendations
- **Console Warnings**: Clear, actionable messages with links to web.dev documentation

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

## How It Works

### Performance Monitoring

Nuxt Hints uses the **Performance Observer API** to monitor your application.

### Third-Party Script Analysis

The module automatically detects and analyzes third-party scripts.

### Example Console Output

When Nuxt Hints detects issues, you'll see warnings in console like:

```
[@nuxt/hints:performance] LCP Element should not have `loading="lazy"`
Learn more: https://web.dev/optimize-lcp/#optimize-the-priority-the-resource-is-given
```

```
[@nuxt/hints:performance] LCP Element can be served in a next gen format like `webp` or `avif`
Learn more: https://web.dev/choose-the-right-image-format/
Use: https://image.nuxt.com/usage/nuxt-img#format
```

```
[@nuxt/hints] Third-party script "https://cdn.example.com/script.js" is missing crossorigin attribute. 
Consider adding crossorigin="anonymous" for better security and error reporting.
```

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
