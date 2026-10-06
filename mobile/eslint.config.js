// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require("eslint/config");
const expoConfig = require("eslint-config-expo/flat");

module.exports = defineConfig([
  expoConfig,
  { ignores: ["dist/*", ".expo/*"] },
  // An HTML rule: apostrophes in React Native <Text> need no escaping.
  { rules: { "react/no-unescaped-entities": "off" } },
]);
