import { Router } from 'express';
import axios from 'axios';
import { RoomManager } from '../room';
import { getMovies, getPlayers, getServerId, playOnPlayer } from '../plex';
import { Movie } from '../types';

// Room-scoped Plex access using the host's credentials, so guests who joined by
// link/QR (no Plex login) get the same deck and posters without ever seeing the token.
export function createRoomsRouter(roomManager: RoomManager) {
  const router = Router();

  const lookup = (code: string) => {
    const room = roomManager.getRoomByCode(code);
    const session = room && roomManager.getPlexSession(room.id);
    return room && session ? { room, session } : undefined;
  };

  router.get('/:code/movies', async (req, res) => {
    const found = lookup(req.params.code);
    if (!found) return res.status(404).json({ error: 'Room not found.' });
    const { room, session } = found;

    session.deck ??= (async () => {
      const deck: Movie[] = [];
      for (const lib of room.selectedLibraries) {
        deck.push(...await getMovies(
          session.plexUrl, session.plexToken, lib.key, lib.type,
          room.selectedGenres.join(',') || undefined, room.yearMin, room.yearMax,
          room.selectedContentRatings.join(',') || undefined, room.durationMin, room.durationMax, room.sortOrder,
        ));
      }
      return deck;
    })();

    try {
      res.json(await session.deck);
    } catch (error) {
      session.deck = undefined; // let the next request retry
      console.error(`rooms: ${(error as Error).message}`); // not the full AxiosError: it carries the Plex token
      res.status(502).json({ error: 'Failed to load movies from Plex.' });
    }
  });

  router.get('/:code/poster', async (req, res) => {
    const found = lookup(req.params.code);
    const path = String(req.query.path ?? '');
    if (!found) return res.status(404).end();
    if (!/^\/library\/metadata\/\d+\/(thumb|art)\/\d+$/.test(path)) return res.status(400).end();

    try {
      const upstream = await axios.get<NodeJS.ReadableStream>(`${found.session.plexUrl}/photo/:/transcode`, {
        headers: { 'X-Plex-Token': found.session.plexToken },
        params: { url: path, width: 600, height: 900, minSize: 1, upscale: 1 },
        responseType: 'stream',
      });
      res.set('Content-Type', upstream.headers['content-type'] ?? 'image/jpeg');
      res.set('Cache-Control', 'private, max-age=86400');
      upstream.data.pipe(res);
    } catch {
      res.status(502).end();
    }
  });

  router.get('/:code/players', async (req, res) => {
    const found = lookup(req.params.code);
    if (!found) return res.status(404).json({ error: 'Room not found.' });
    try {
      const { plexUrl, plexToken } = found.session;
      // serverId lets the client build an "Open in Plex" link for any device the list misses
      const [players, serverId] = await Promise.all([getPlayers(plexUrl, plexToken), getServerId(plexUrl, plexToken)]);
      res.json({ serverId, players });
    } catch (error) {
      console.error(`rooms: ${(error as Error).message}`); // not the full AxiosError: it carries the Plex token
      res.status(502).json({ error: 'Could not reach Plex.' });
    }
  });

  router.post('/:code/play', async (req, res) => {
    const found = lookup(req.params.code);
    const { movieKey, playerId } = req.body ?? {};
    if (!found) return res.status(404).json({ error: 'Room not found.' });
    if (typeof movieKey !== 'string' || typeof playerId !== 'string') {
      return res.status(400).json({ error: 'movieKey and playerId are required.' });
    }
    try {
      await playOnPlayer(found.session.plexUrl, found.session.plexToken, movieKey, playerId);
      res.status(204).end();
    } catch (error) {
      console.error(`rooms: ${(error as Error).message}`); // not the full AxiosError: it carries the Plex token
      res.status(502).json({ error: 'The player did not accept the request.' });
    }
  });

  return router;
}
