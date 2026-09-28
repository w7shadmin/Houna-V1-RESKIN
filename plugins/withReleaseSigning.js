// Release builds are signed with Houna's own upload key, never the public debug key: anyone can
// sign an APK with the debug key, and Android would install it as an "update" over a shared build.
// The keystore and its passwords live outside the repo, in the Gradle user properties
// (~/.gradle/gradle.properties): HOUNA_UPLOAD_STORE_FILE, HOUNA_UPLOAD_KEY_ALIAS,
// HOUNA_UPLOAD_STORE_PASSWORD, HOUNA_UPLOAD_KEY_PASSWORD. A machine without them still builds a
// release, signed with the debug key as before, with a loud warning, so it's never shared by mistake.
const { withAppBuildGradle } = require('expo/config-plugins');

const MARKER = '// houna: release signing';

const SIGNING_CONFIG = `
        ${MARKER}
        release {
            if (project.hasProperty('HOUNA_UPLOAD_STORE_FILE')) {
                storeFile file(HOUNA_UPLOAD_STORE_FILE)
                storePassword HOUNA_UPLOAD_STORE_PASSWORD
                keyAlias HOUNA_UPLOAD_KEY_ALIAS
                keyPassword HOUNA_UPLOAD_KEY_PASSWORD
            }
        }`;

module.exports = function withReleaseSigning(config) {
  return withAppBuildGradle(config, (cfg) => {
    let src = cfg.modResults.contents;
    if (!src.includes(MARKER)) {
      // Add a release signing config beside the template's debug one.
      const signingAnchor = /signingConfigs\s*\{/;
      if (!signingAnchor.test(src)) throw new Error('withReleaseSigning: signingConfigs block not found');
      src = src.replace(signingAnchor, (m) => m + SIGNING_CONFIG);

      // Point the release build type at it (the template signs releases with the debug key).
      const releaseType = /(buildTypes\s*\{[\s\S]*?release\s*\{[\s\S]*?)signingConfig signingConfigs\.debug/;
      if (!releaseType.test(src)) throw new Error('withReleaseSigning: release build type not found');
      src = src.replace(
        releaseType,
        `$1if (project.hasProperty('HOUNA_UPLOAD_STORE_FILE')) {
                signingConfig signingConfigs.release
            } else {
                logger.warn('HOUNA: no upload key in ~/.gradle/gradle.properties; this release is signed with the PUBLIC debug key. Do not share it.')
                signingConfig signingConfigs.debug
            }`,
      );
    }
    cfg.modResults.contents = src;
    return cfg;
  });
};
