import request from 'supertest';
import express from 'express';
import { RoomManager } from '../room';
import { createRoomsRouter } from './rooms';
import { getLibraries, getMovies } from '../plex';

jest.mock('../plex');

it('validates curated lobby credentials and returns its fixed code', async () => {
  const rooms = new RoomManager();
  const app = express();
  app.use(express.json(), createRoomsRouter(rooms));

  expect((await request(app).post('/curated/halloween').send({ plexUrl: ' ', plexToken: 'token' })).status).toBe(400);
  expect((await request(app).post('/curated/halloween').send({ plexUrl: 'http://plex', plexToken: 42 })).status).toBe(400);

  const response = await request(app).post('/curated/halloween').send({ plexUrl: 'http://plex', plexToken: 'token' });
  expect(response.status).toBe(200);
  expect(response.body).toEqual({ code: 'BOO' });
  expect(rooms.getRoomByCode('BOO')?.curated).toBe('halloween');
});

it('builds one shared curated deck from every movie library', async () => {
  const rooms = new RoomManager();
  rooms.createCuratedLobby('BOO', 'http://plex', 'token');
  const app = express();
  app.use(createRoomsRouter(rooms));
  (getLibraries as jest.Mock).mockResolvedValue([
    { key: '1', type: 'movie' }, { key: '2', type: 'show' }, { key: '3', type: 'movie' },
  ]);
  (getMovies as jest.Mock)
    .mockResolvedValueOnce([{ key: 'beetlejuice', title: 'Beetlejuice', year: 1988 }])
    .mockResolvedValueOnce([{ key: 'coco', title: 'Coco', year: 2017 }]);

  const first = await request(app).get('/BOO/movies');
  const second = await request(app).get('/BOO/movies');
  expect(first.status).toBe(200);
  expect(first.body).toEqual(second.body);
  expect(first.body.map((movie: { key: string }) => movie.key).sort()).toEqual(['beetlejuice', 'coco']);
  expect(getLibraries).toHaveBeenCalledTimes(1);
  expect((getMovies as jest.Mock).mock.calls.map(call => call[2])).toEqual(['1', '3']);
});
