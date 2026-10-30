# Nuxt Hints

[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]
[![License][license-src]][license-href]
[![Nuxt][nuxt-src]][nuxt-href]

**A Nuxt module that provides real-time feedback on your application's performance, accessibility, and security right in your browser.**

Nuxt Hints integrates directly into the Nuxt DevTools, giving you actionable insights to improve your web vitals, fix hydration mismatches, and audit third-party scripts without ever leaving your development environment.

- [📖 &nbsp;Read Documentation](https://nuxt.com/modules/hints)
- [✨ &nbsp;Release Notes](https://github.com/nuxt/hints/releases)

![Nuxt Hints homepage in the Nuxt DevTools](./docs/images/devtools-homepage.png)

## Features

- 🚀 Rich DevTools UI to visualize issues, inspect elements, and get recommendations
- ⚡️ [Web Vitals](https://nuxt.com/modules/hints/web-vitals) analysis for LCP, INP, and CLS
- 💧 [Hydration mismatch](https://nuxt.com/modules/hints/hydration) debugging with a side-by-side diff
- 📦 [Third-party script](https://nuxt.com/modules/hints/third-party-scripts) auditing
- 🧩 [Unused component detection](https://nuxt.com/modules/hints/lazy-load) to suggest lazy-loading
- ✅ [HTML validation](https://nuxt.com/modules/hints/html-validate) of server-rendered pages

## Quick Setup

```bash
npx nuxt add hints
```

Then open your Nuxt app, go to the DevTools, and click the Hints icon to get started.

## Contributing

See the [contributing guide](https://nuxt.com/modules/hints/contributing).

## License

[MIT License](./LICENSE)

<!-- Badges -->

[npm-version-src]: https://img.shields.io/npm/v/@nuxt/hints/latest.svg?style=flat&colorA=18181B&colorB=28CF8D
[npm-version-href]: https://npmx.dev/package/@nuxt/hints
[npm-downloads-src]: https://img.shields.io/npm/dm/@nuxt/hints.svg?style=flat&colorA=18181B&colorB=28CF8D
[npm-downloads-href]: https://npmx.dev/package/@nuxt/hints
[license-src]: https://img.shields.io/npm/l/@nuxt/hints.svg?style=flat&colorA=18181B&colorB=28CF8D
[license-href]: https://npmx.dev/package/@nuxt/hints
[nuxt-src]: https://img.shields.io/badge/Nuxt-18181B?logo=nuxt
[nuxt-href]: https://nuxt.com
