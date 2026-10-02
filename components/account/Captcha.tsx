import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';

/**
 * Cloudflare Turnstile, the bot check on sign-in and sign-up (Supabase Auth checks its token). On
 * only while `app_config`'s turnstile site key is set (lib/remoteConfig.ts). Cloudflare's own
 * widget runs in a web view on the phone (as if on houna.org: the widget's hostnames must include
 * houna.org, and localhost for the web preview); on the web it runs in the page.
 *
 * It stays folded away and passes on its own for most people; it opens only when Cloudflare asks
 * the person to tick a box. A token is good for one sign-in: remount it (`key`) to get another.
 */
interface CaptchaProps {
  siteKey: string;
  onToken: (token: string | null) => void;
  onError?: () => void;
}

type Msg = { t: 'token'; v: string } | { t: 'expired' } | { t: 'error' } | { t: 'show' } | { t: 'hide' };

const SCRIPT = 'https://challenges.cloudflare.com/turnstile/v0/api.js';
const HEIGHT = 72;

export default function Captcha({ siteKey, onToken, onError }: CaptchaProps) {
  const { isNight } = useTheme();
  const { language } = useLanguage();
  const [open, setOpen] = useState(false);
  const handle = (m: Msg) => {
    if (m.t === 'token') onToken(m.v);
    else if (m.t === 'expired') onToken(null);
    else if (m.t === 'error') {
      onToken(null);
      onError?.();
    } else setOpen(m.t === 'show');
  };
  const options = { sitekey: siteKey, theme: isNight ? 'dark' : 'light', language };

  return (
    <View style={[styles.fold, { height: open ? HEIGHT : 0 }]}>
      {Platform.OS === 'web' ? <WebWidget options={options} onMessage={handle} /> : <NativeWidget options={options} onMessage={handle} />}
    </View>
  );
}

type Options = { sitekey: string; theme: string; language: string };

function NativeWidget({ options, onMessage }: { options: Options; onMessage: (m: Msg) => void }) {
  // Loaded lazily: a dev client built before react-native-webview has no native side for it.
  const WebView = useMemo(() => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      return require('react-native-webview').WebView as React.ComponentType<Record<string, unknown>>;
    } catch {
      return null;
    }
  }, []);
  const html = `<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width,initial-scale=1">
<style>html,body{margin:0;background:transparent;display:flex;justify-content:center}</style>
<script src="${SCRIPT}?render=explicit&onload=go" async defer></script></head><body><div id="w"></div><script>
function post(m){window.ReactNativeWebView.postMessage(JSON.stringify(m))}
function go(){turnstile.render('#w',Object.assign(${JSON.stringify(options)},{
callback:function(v){post({t:'token',v:v})},'expired-callback':function(){post({t:'expired'})},
'error-callback':function(){post({t:'error'})},'before-interactive-callback':function(){post({t:'show'})},
'after-interactive-callback':function(){post({t:'hide'})}}))}
</script></body></html>`;
  if (!WebView) return null;
  return (
    <WebView
      source={{ html, baseUrl: 'https://houna.org' }}
      originWhitelist={['https://*']}
      style={styles.frame}
      scrollEnabled={false}
      onMessage={(e: { nativeEvent: { data: string } }) => {
        try {
          onMessage(JSON.parse(e.nativeEvent.data) as Msg);
        } catch {
          // Not ours.
        }
      }}
    />
  );
}

type TurnstileApi = { render: (el: HTMLElement, o: Record<string, unknown>) => string; remove: (id: string) => void };

function WebWidget({ options, onMessage }: { options: Options; onMessage: (m: Msg) => void }) {
  const box = useRef<View>(null);
  const report = useRef(onMessage);
  report.current = onMessage;
  useEffect(() => {
    const w = window as unknown as { turnstile?: TurnstileApi };
    let id: string | null = null;
    let alive = true;
    const render = () => {
      const el = box.current as unknown as HTMLElement | null;
      if (!alive || !el || !w.turnstile) return;
      id = w.turnstile.render(el, {
        ...options,
        callback: (v: string) => report.current({ t: 'token', v }),
        'expired-callback': () => report.current({ t: 'expired' }),
        'error-callback': () => report.current({ t: 'error' }),
        'before-interactive-callback': () => report.current({ t: 'show' }),
        'after-interactive-callback': () => report.current({ t: 'hide' }),
      });
    };
    if (w.turnstile) render();
    else {
      let script = document.querySelector<HTMLScriptElement>(`script[src^="${SCRIPT}"]`);
      if (!script) {
        script = document.createElement('script');
        script.src = `${SCRIPT}?render=explicit`;
        script.async = true;
        document.head.appendChild(script);
      }
      script.addEventListener('load', render);
    }
    return () => {
      alive = false;
      if (id && w.turnstile) w.turnstile.remove(id);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options.sitekey, options.theme, options.language]);
  return <View ref={box} style={styles.frame} />;
}

const styles = StyleSheet.create({
  fold: {
    overflow: 'hidden',
    alignItems: 'center',
  },
  frame: {
    width: 300,
    height: HEIGHT,
    backgroundColor: 'transparent',
  },
});
