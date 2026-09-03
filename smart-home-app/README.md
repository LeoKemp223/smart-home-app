# Smart Home App

uni-app + Vue 3 + TypeScript project created with the CLI workflow.

## Install

```bash
npm install
```

## Development

```bash
npm run dev:h5
npm run dev:mp-weixin
```

The WeChat Mini Program output is generated in `dist/dev/mp-weixin`. Open that
directory with WeChat DevTools.

## Build

```bash
npm run build:h5
npm run build:mp-weixin
npm run build:app
```

## Checks

```bash
npm run type-check
npm run build
```

Android packaging and iOS packaging still require the corresponding native
toolchains. iOS packaging requires macOS and Xcode.
