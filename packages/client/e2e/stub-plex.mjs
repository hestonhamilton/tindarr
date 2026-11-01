// Just enough of the Plex Media Server API for the Halloween lobby e2e run: one movie
// library (some curated titles, some not), one show library, posters and identity.
import http from 'node:http';

export const STUB_TOKEN = 'e2e-token';

export const STUB_MOVIES = [
  { ratingKey: '101', title: 'Beetlejuice', year: 1988 },
  { ratingKey: '102', title: 'Shaun of the Dead', year: 2004 },
  { ratingKey: '103', title: 'Clue', year: 1985 },
  { ratingKey: '104', title: 'The Others', year: 2001 },
  { ratingKey: '105', title: 'Hereditary', year: 2018 },
  { ratingKey: '106', title: 'The Nightmare Before Christmas', year: 1993 },
  // Not on the curated list: must never reach the deck
  { ratingKey: '201', title: 'Paddington 2', year: 2017 },
  { ratingKey: '202', title: 'Heat', year: 1995 },
].map((m) => ({
  ...m,
  type: 'movie',
  summary: `${m.title} is a stub movie used by the e2e run. It has a summary long enough to wrap onto a few lines on a phone screen, so clamping can be checked.`,
  thumb: `/library/metadata/${m.ratingKey}/thumb/1`,
  duration: 5400000,
  contentRating: 'PG-13',
  Genre: [{ tag: 'Horror' }],
}));

const json = (res, body) => {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(body));
};

const poster = (url) => {
  const id = /metadata\/(\d+)/.exec(url ?? '')?.[1] ?? '0';
  const movie = STUB_MOVIES.find((m) => m.ratingKey === id);
  const hue = (Number(id) * 47) % 360;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="900"><rect width="600" height="900" fill="hsl(${hue},45%,25%)"/><text x="300" y="450" font-size="48" fill="#fff" text-anchor="middle" font-family="sans-serif">${movie?.title ?? id}</text></svg>`;
};

export function startStubPlex(port = 0) {
  const server = http.createServer((req, res) => {
    const url = new URL(req.url, 'http://stub');
    if (req.headers['x-plex-token'] !== STUB_TOKEN) {
      res.writeHead(401).end();
      return;
    }
    if (url.pathname === '/library/sections') {
      return json(res, { MediaContainer: { Directory: [
        { key: '1', title: 'Movies', type: 'movie' },
        { key: '2', title: 'TV Shows', type: 'show' },
      ] } });
    }
    if (url.pathname === '/library/sections/1/all') return json(res, { MediaContainer: { Metadata: STUB_MOVIES } });
    if (url.pathname === '/library/sections/2/all') return json(res, { MediaContainer: { Metadata: [] } });
    if (url.pathname === '/photo/:/transcode') {
      res.writeHead(200, { 'Content-Type': 'image/svg+xml' });
      return res.end(poster(url.searchParams.get('url')));
    }
    if (url.pathname === '/identity') return json(res, { MediaContainer: { machineIdentifier: 'stub-server' } });
    if (url.pathname === '/clients') return json(res, { MediaContainer: { Server: [
      { name: 'Living Room TV', product: 'Plex for Android (TV)', machineIdentifier: 'stub-tv', protocolCapabilities: 'timeline,playback' },
    ] } });
    res.writeHead(404).end();
  });
  return new Promise((resolve) => server.listen(port, '127.0.0.1', () => resolve(server)));
}
