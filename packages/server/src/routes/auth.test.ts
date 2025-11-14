import request from 'supertest';
import express from 'express';
import authRouter from './auth';
import { getNewPin, getAuthToken } from '../plex';

jest.mock('../plex');

const mockedGetNewPin = getNewPin as jest.Mock;
const mockedGetAuthToken = getAuthToken as jest.Mock;

const app = express();
app.use('/auth', authRouter);

describe('Auth routes', () => {
  let errorSpy: jest.SpyInstance;

  beforeEach(() => {
    errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    errorSpy.mockRestore();
  });
  describe('POST /auth/plex/pin', () => {
    it('should return a new pin', async () => {
      const pin = { id: 123, code: 'ABCD' };
      mockedGetNewPin.mockResolvedValue(pin);

      const res = await request(app).post('/auth/plex/pin');

      expect(res.status).toBe(200);
      expect(res.body).toEqual(pin);
    });

    it('should return 500 if getting a new pin fails', async () => {
      mockedGetNewPin.mockRejectedValue(new Error('Failed'));

      const res = await request(app).post('/auth/plex/pin');

      expect(res.status).toBe(500);
      expect(res.body).toEqual({ error: 'Failed to get a new Plex pin.' });
    });
  });

  describe('GET /auth/plex/token/:pinId', () => {
    it('should return an auth token', async () => {
      const authToken = 'test-auth-token';
      mockedGetAuthToken.mockResolvedValue(authToken);

      const res = await request(app).get('/auth/plex/token/123');

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ authToken });
    });

    it('should return 404 if auth token is not found', async () => {
      mockedGetAuthToken.mockResolvedValue(null);

      const res = await request(app).get('/auth/plex/token/123');

      expect(res.status).toBe(404);
      expect(res.body).toEqual({ error: 'Auth token not found.' });
    });

    it('should return 500 if getting an auth token fails', async () => {
      mockedGetAuthToken.mockRejectedValue(new Error('Failed'));

      const res = await request(app).get('/auth/plex/token/123');

      expect(res.status).toBe(500);
      expect(res.body).toEqual({ error: 'Failed to get Plex auth token.' });
    });
  });
});
