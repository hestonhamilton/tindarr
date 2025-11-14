import axios from 'axios';
import { getNewPin, getAuthToken, getLibraries, getMovies } from './plex';
import { Movie } from './plex';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('Plex API', () => {
  describe('getNewPin', () => {
    it('should return a new pin', async () => {
      const pin = { id: 123, code: 'ABCD' };
      mockedAxios.post.mockResolvedValue({
        data: pin,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: { url: '' },
      });

      const result = await getNewPin();

      expect(result).toEqual(pin);
      expect(mockedAxios.post).toHaveBeenCalledWith(
        'https://plex.tv/api/v2/pins?strong=true',
        null,
        {
          headers: {
            'X-Plex-Product': 'MovieMatch',
            'X-Plex-Client-Identifier': 'moviematch-v2',
            'Accept': 'application/json',
          },
        }
      );
    });
  });

  describe('getAuthToken', () => {
    it('should return an auth token', async () => {
      const authToken = 'test-auth-token';
      mockedAxios.get.mockResolvedValue({
        data: { authToken },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: { url: '' },
      });

      const result = await getAuthToken(123);

      expect(result).toEqual(authToken);
      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://plex.tv/api/v2/pins/123',
        {
          headers: {
            'X-Plex-Client-Identifier': 'moviematch-v2',
            'Accept': 'application/json',
          },
        }
      );
    });

    it('should return null if there is no auth token', async () => {
      mockedAxios.get.mockResolvedValue({
        data: {},
        status: 200,
        statusText: 'OK',
        headers: {},
        config: { url: '' },
      });

      const result = await getAuthToken(123);

      expect(result).toBeNull();
    });
  });

  describe('getLibraries', () => {
    it('should return a list of libraries', async () => {
      const mockData = {
        MediaContainer: {
          Directory: [
            { key: '1', title: 'Movies', type: 'movie' },
            { key: '2', title: 'TV Shows', type: 'show' },
          ],
        },
      };
      mockedAxios.get.mockResolvedValue({
        data: mockData,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: { url: '' },
      });

      const result = await getLibraries('http://localhost:32400', 'test-token');

      expect(result).toEqual([
        { key: '1', title: 'Movies', type: 'movie' },
        { key: '2', title: 'TV Shows', type: 'show' },
      ]);
      expect(mockedAxios.get).toHaveBeenCalledWith(
        'http://localhost:32400/library/sections',
        {
          headers: {
            'X-Plex-Token': 'test-token',
            'Accept': 'application/json',
          },
        }
      );
    });
  });

  describe('getMovies', () => {
    it('should return a list of movies from a library', async () => {
      const mockData = {
        MediaContainer: {
          Metadata: [
            { ratingKey: '3', title: 'Movie 1', year: 2020, summary: 'Summary 1', thumb: '/poster1.jpg' },
            { ratingKey: '4', title: 'Movie 2', year: 2021, summary: 'Summary 2', thumb: '/poster2.jpg' },
          ],
        },
      };
      mockedAxios.get.mockResolvedValue({
        data: mockData,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: { url: '' },
      });

      const result = await getMovies('http://localhost:32400', 'test-token', '1');

      expect(result).toEqual([
        { key: '3', title: 'Movie 1', year: 2020, summary: 'Summary 1', posterUrl: '/poster1.jpg' },
        { key: '4', title: 'Movie 2', year: 2021, summary: 'Summary 2', posterUrl: '/poster2.jpg' },
      ]);
      expect(mockedAxios.get).toHaveBeenCalledWith(
        'http://localhost:32400/library/sections/1/all',
        {
          headers: {
            'X-Plex-Token': 'test-token',
            'Accept': 'application/json',
          },
        }
      );
    });
  });
});
