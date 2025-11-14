import request from 'supertest';
import express from 'express';
import plexRouter from './plex';
import { getLibraries } from '../plex';

jest.mock('../plex');

const mockedGetLibraries = getLibraries as jest.Mock;

const app = express();
app.use(express.json()); // For parsing application/json
app.use(express.urlencoded({ extended: true })); // For parsing application/x-www-form-urlencoded
app.use('/plex', plexRouter);

describe('Plex routes', () => {
  let errorSpy: jest.SpyInstance;

  beforeEach(() => {
    errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    errorSpy.mockRestore();
  });

  describe('GET /plex/libraries', () => {
    it('should return a list of libraries', async () => {
      const libraries = [
        { key: '1', title: 'Movies', type: 'movie' },
        { key: '2', title: 'TV Shows', type: 'show' },
      ];
      mockedGetLibraries.mockResolvedValue(libraries);

      const res = await request(app)
        .get('/plex/libraries')
        .query({ plexUrl: 'http://localhost:32400', plexToken: 'test-token' });

      expect(res.status).toBe(200);
      expect(res.body).toEqual(libraries);
      expect(mockedGetLibraries).toHaveBeenCalledWith(
        'http://localhost:32400',
        'test-token'
      );
    });

    it('should return 400 if plexUrl or plexToken are missing', async () => {
      const res = await request(app).get('/plex/libraries');

      expect(res.status).toBe(400);
      expect(res.body).toEqual({ error: 'Plex URL and token are required.' });
    });

    it('should return 500 if getting libraries fails', async () => {
      mockedGetLibraries.mockRejectedValue(new Error('Failed'));

      const res = await request(app)
        .get('/plex/libraries')
        .query({ plexUrl: 'http://localhost:32400', plexToken: 'test-token' });

      expect(res.status).toBe(500);
      expect(res.body).toEqual({ error: 'Failed to get Plex libraries.' });
    });
  });
});
