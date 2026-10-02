// Sends a push notification through Expo's push service, until the Houna Console takes this over.
//
//   One phone (a test; needs nothing but its token):
//     node scripts/send-push.js --to "ExponentPushToken[...]" --title "Hello" --body "A test" [--url /tanafas]
//
//   A broadcast to every Alias who opted in to that kind:
//     SUPABASE_SERVICE_ROLE_KEY=... node scripts/send-push.js --kind story|stats|events --title "..." --body "..." [--url /events]
//
//   "We're live" (a Houna event starting to stream; set app_config.live_event first, so /live has it):
//     SUPABASE_SERVICE_ROLE_KEY=... node scripts/send-push.js --kind events --title "We're live" --body "..." --url /live
//
// The service-role key is read from the environment only: never put it in a file in this repo.
// --url must be one of Houna's own paths (lib/pushPath.ts); a tap opens it. Tokens Expo reports as no
// longer registered (the app was uninstalled) are removed. Title and body go out as given: write
// them in the language of the people you're sending to (there's no per-person language yet).

const fs = require('fs');
const path = require('path');

const args = Object.fromEntries(
  process.argv.slice(2).reduce((pairs, a, i, all) => (a.startsWith('--') ? [...pairs, [a.slice(2), all[i + 1]]] : pairs), []),
);
const fail = (m) => { console.error(m); process.exit(1); };
if (!args.title || !args.body) fail('Needs --title and --body.');
if (!args.to && !['story', 'stats', 'events'].includes(args.kind)) fail('Needs --to <token> or --kind story|stats|events.');
if (args.url && !/^\/[A-Za-z0-9\-/?=&_%.]*$/.test(args.url)) fail('--url must be an in-app path such as /tanafas.');

const env = Object.fromEntries(
  fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf8').split(/\r?\n/).filter((l) => l.includes('='))
    .map((l) => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1)]),
);
const SUPABASE_URL = env.EXPO_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function db(method, query, body) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/push_tokens?${query}`, {
    method,
    headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}`, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) fail(`Database ${method} failed: ${res.status} ${await res.text()}`);
  return method === 'GET' ? res.json() : null;
}

(async () => {
  let tokens;
  if (args.to) tokens = [args.to];
  else {
    if (!SERVICE_KEY) fail('A broadcast needs SUPABASE_SERVICE_ROLE_KEY in the environment.');
    const column = { story: 'wants_story_highlights', stats: 'wants_community_stats', events: 'wants_events' }[args.kind];
    tokens = (await db('GET', `select=token&${column}=eq.true`)).map((r) => r.token);
  }
  if (!tokens.length) return console.log('Nobody to send to.');

  const message = (to) => ({ to, title: args.title, body: args.body, sound: 'default', data: args.url ? { url: args.url } : {} });
  let sent = 0;
  const gone = [];
  for (let i = 0; i < tokens.length; i += 100) {
    const batch = tokens.slice(i, i + 100);
    const res = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(batch.map(message)),
    });
    const out = await res.json();
    if (!res.ok || !Array.isArray(out.data)) fail(`Expo refused the batch: ${JSON.stringify(out)}`);
    out.data.forEach((ticket, j) => {
      if (ticket.status === 'ok') sent += 1;
      else {
        console.warn(`Not sent to ${batch[j].slice(0, 30)}…: ${ticket.message}`);
        if (ticket.details?.error === 'DeviceNotRegistered') gone.push(batch[j]);
      }
    });
  }
  if (gone.length && SERVICE_KEY) {
    await db('DELETE', `token=in.(${gone.map((t) => `"${t}"`).join(',')})`);
    console.log(`Removed ${gone.length} token(s) no longer registered.`);
  }
  console.log(`Sent to ${sent} of ${tokens.length}.`);
})();
