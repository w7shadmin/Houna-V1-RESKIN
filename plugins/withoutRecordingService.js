// expo-audio declares a recording service (foregroundServiceType "microphone") in its own manifest,
// though Houna never records. Google Play asks every app declaring a microphone foreground service to
// justify it, so the merged manifest drops it (tools:node="remove"). The playback service stays: the
// meditation player's lock-screen controls use it.
const { withAndroidManifest, AndroidConfig } = require('expo/config-plugins');

const RECORDING_SERVICE = 'expo.modules.audio.service.AudioRecordingService';

module.exports = function withoutRecordingService(config) {
  return withAndroidManifest(config, (cfg) => {
    const manifest = cfg.modResults.manifest;
    manifest.$ = { ...manifest.$, 'xmlns:tools': 'http://schemas.android.com/tools' };
    const app = AndroidConfig.Manifest.getMainApplicationOrThrow(cfg.modResults);
    app.service = (app.service ?? []).filter((s) => s.$?.['android:name'] !== RECORDING_SERVICE);
    app.service.push({ $: { 'android:name': RECORDING_SERVICE, 'tools:node': 'remove' } });
    return cfg;
  });
};
