// eslint-disable-next-line @typescript-eslint/no-var-requires
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// expo-sqlite's web build loads a wa-sqlite .wasm worker — without this,
// Metro tries to resolve it as a JS module and bundling fails with
// "Unable to resolve ./wa-sqlite/wa-sqlite.wasm", which silently hangs
// every SQLite call on web (journal/mood — nothing throws, it just never
// resolves) rather than erroring visibly.
config.resolver.assetExts.push('wasm');

module.exports = config;
