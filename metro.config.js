// Learn more: https://docs.expo.dev/guides/customizing-metro/
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// ES-module import support lets release builds drop unused code (tree shaking,
// enabled by the EXPO_UNSTABLE_* flags in eas.json); inline requires load each
// module only when it is first used, which shortens app start.
config.transformer.getTransformOptions = async () => ({
  transform: { experimentalImportSupport: true, inlineRequires: true },
});

module.exports = config;
