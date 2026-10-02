import React, { useMemo } from 'react';
import { Platform, StyleSheet, View } from 'react-native';

/** A YouTube video id, as the event pages carry them (houna.org's embeds). */
export const YOUTUBE_ID = /^[A-Za-z0-9_-]{6,20}$/;

/**
 * An event's YouTube video, playing inside Houna once the person presses play on its thumbnail (the
 * event page swaps this in). YouTube's privacy-enhanced embed (youtube-nocookie.com: no cookies
 * until the video plays), in a web view on the phone as if on houna.org (YouTube wants an origin),
 * and an iframe on the web. Fills its parent; the parent keeps 16:9. The id is checked, so nothing
 * else can be loaded through it.
 */
export default function YouTubePlayer({ id, title }: { id: string; title: string }) {
  const src = YOUTUBE_ID.test(id)
    ? `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&playsinline=1&rel=0&modestbranding=1`
    : null;

  // Loaded lazily: a dev client built before react-native-webview has no native side for it.
  const WebView = useMemo(() => {
    if (Platform.OS === 'web') return null;
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      return require('react-native-webview').WebView as React.ComponentType<Record<string, unknown>>;
    } catch {
      return null;
    }
  }, []);

  if (!src) return null;
  if (Platform.OS === 'web') {
    return React.createElement('iframe', {
      src,
      title,
      allow: 'autoplay; encrypted-media; picture-in-picture; fullscreen',
      allowFullScreen: true,
      style: { border: 0, width: '100%', height: '100%' },
    });
  }
  if (!WebView) return null;
  const html = `<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width,initial-scale=1">
<style>html,body{margin:0;height:100%;background:#000}iframe{border:0;width:100%;height:100%}</style></head>
<body><iframe src="${src}" title="${title.replace(/["<>&]/g, '')}" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe></body></html>`;
  return (
    <View style={StyleSheet.absoluteFill}>
      <WebView
        source={{ html, baseUrl: 'https://houna.org' }}
        originWhitelist={['https://*']}
        allowsInlineMediaPlayback
        allowsFullscreenVideo
        mediaPlaybackRequiresUserAction={false}
        style={styles.web}
        scrollEnabled={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  web: {
    flex: 1,
    backgroundColor: '#000',
  },
});
