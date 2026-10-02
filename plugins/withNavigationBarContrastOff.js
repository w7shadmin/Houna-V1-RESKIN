// React Native 0.81's edge-to-edge setup (WindowUtil.enableEdgeToEdge, run
// from ReactActivityDelegate.onCreate) forces
// `window.isNavigationBarContrastEnforced = true`, overriding app.json's
// `androidNavigationBar.enforceContrast: false`. With 3-button navigation
// that draws a translucent scrim over the tab bar's bottom inset — a darker
// band in Night. Turn it back off right after super.onCreate.
const { withMainActivity } = require('expo/config-plugins');

const MARKER = '// houna: nav bar contrast off';
const SNIPPET = `
    ${MARKER}
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
      window.isNavigationBarContrastEnforced = false
    }`;

module.exports = function withNavigationBarContrastOff(config) {
  return withMainActivity(config, (cfg) => {
    let src = cfg.modResults.contents;
    if (cfg.modResults.language !== 'kt') {
      throw new Error('withNavigationBarContrastOff expects a Kotlin MainActivity');
    }
    if (!src.includes(MARKER)) {
      const anchor = /super\.onCreate\([^)]*\)/;
      if (!anchor.test(src)) throw new Error('withNavigationBarContrastOff: super.onCreate not found');
      src = src.replace(anchor, (m) => m + SNIPPET);
      if (!src.includes('import android.os.Build')) {
        src = src.replace(/^package .*$/m, (m) => `${m}\n\nimport android.os.Build`);
      }
    }
    cfg.modResults.contents = src;
    return cfg;
  });
};
