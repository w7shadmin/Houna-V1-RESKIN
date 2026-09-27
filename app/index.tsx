import { useEffect, useState } from 'react';
import { Redirect } from 'expo-router';
import { firstBreathDone } from '@/lib/firstRun';

/** A first launch meets the first breath (app/welcome.tsx) before anything else; every other goes Home. */
export default function Index() {
  const [done, setDone] = useState<boolean | null>(null);
  useEffect(() => {
    firstBreathDone().then(setDone);
  }, []);
  // A moment's read of the phone's storage, under the splash.
  if (done === null) return null;
  return <Redirect href={done ? '/(tabs)' : '/welcome'} />;
}
