const { withAndroidManifest } = require('expo/config-plugins');

// Android blocks plain HTTP by default for apps targeting SDK 28+. This app talks to the
// desktop widget over plain HTTP on the local network (see src/sync.ts), so cleartext must
// be explicitly allowed.
module.exports = function withCleartextTraffic(config) {
  return withAndroidManifest(config, (config) => {
    const application = config.modResults.manifest.application[0];
    application.$['android:usesCleartextTraffic'] = 'true';
    return config;
  });
};
