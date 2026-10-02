import { useEffect, useState } from 'react';
import { BUNDLED_CONFIG, loadRemoteConfig, type RemoteConfig } from '@/lib/remoteConfig';

/** The launch settings (lib/remoteConfig.ts), the bundled defaults until they've loaded. */
export function useRemoteConfig(): RemoteConfig {
  const [config, setConfig] = useState<RemoteConfig>(BUNDLED_CONFIG);
  useEffect(() => {
    let alive = true;
    loadRemoteConfig().then((c) => alive && setConfig(c));
    return () => {
      alive = false;
    };
  }, []);
  return config;
}
