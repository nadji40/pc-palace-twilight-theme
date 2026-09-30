// postcss.config.js
const {excludeRegionsPlugin} = require('./scripts/palace-scope.cjs');

module.exports = {
  plugins: [
    require('postcss-import'),
    require('tailwindcss/nesting')('postcss-nesting'),
    require('tailwindcss'),
    require('postcss-preset-env')({features: {'nesting-rules': true}}),
    // PC Palace regions are styled by the reference CSS only (see scripts/palace-scope.cjs).
    excludeRegionsPlugin(),
  ]
}
