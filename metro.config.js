// Learn more: https://docs.expo.dev/guides/customizing-metro/
const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Older copies of the app live in these folders; Metro should not watch or bundle them.
const escape = (p) => p.replace(/[/\\^$*+?.()|[\]{}]/g, '\\$&');
config.resolver.blockList = [
  ...[].concat(config.resolver.blockList ?? []),
  ...['sheshync', 'YourGoGirl'].map((dir) => new RegExp(`^${escape(path.join(__dirname, dir))}[/\\\\]`)),
];

// ES-module import support lets release builds drop unused code (tree shaking,
// enabled by the EXPO_UNSTABLE_* flags in eas.json); inline requires load each
// module only when it is first used, which shortens app start.
config.transformer.getTransformOptions = async () => ({
  transform: { experimentalImportSupport: true, inlineRequires: true },
});

module.exports = config;
