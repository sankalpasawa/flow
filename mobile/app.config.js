// Expo config wrapper around app.json.
//
// Expo reads app.config.js in preference to app.json, so this file spreads the
// static "expo" object from app.json and layers on one env-gated tweak:
//
//   PAGES_EXPORT=1 npx expo export --platform web
//
// sets `experiments.baseUrl` to "/flow" so the web export works when served
// from https://sankalpasawa.github.io/flow/ (GitHub Pages project site).
//
// With PAGES_EXPORT unset (Vercel, local dev, EAS) baseUrl stays undefined and
// the build is the same as before this file existed.
const appJson = require('./app.json');

const isPagesExport = process.env.PAGES_EXPORT === '1';

module.exports = ({ config }) => ({
  ...config,
  ...appJson.expo,
  experiments: {
    ...(appJson.expo.experiments || {}),
    ...(isPagesExport ? { baseUrl: '/flow' } : {}),
  },
});
