const { withAppBuildGradle, createRunOncePlugin } = require("expo/config-plugins");

const PACKAGE_NAME = "with-react-native-iap-android";
const PACKAGE_VERSION = "1.0.0";
const STRATEGY_LINE = '        missingDimensionStrategy "platform", "play"';

function addMissingDimensionStrategy(contents) {
  if (contents.includes('missingDimensionStrategy "platform", "play"')) {
    return contents;
  }

  return contents.replace(
    /defaultConfig\s*\{\s*\n/g,
    (match) => `${match}${STRATEGY_LINE}\n`,
  );
}

const withReactNativeIapAndroid = (config) =>
  withAppBuildGradle(config, (config) => {
    config.modResults.contents = addMissingDimensionStrategy(config.modResults.contents);
    return config;
  });

module.exports = createRunOncePlugin(
  withReactNativeIapAndroid,
  PACKAGE_NAME,
  PACKAGE_VERSION,
);
