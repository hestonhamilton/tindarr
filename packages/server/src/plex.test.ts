import axios from 'axios';
import { getNewPin, getAuthToken, getLibraries, getMovies, getMoviesCount } from './plex';
import { Movie } from './types';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

beforeEach(() => {
  jest.clearAllMocks();
});

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
            'X-Plex-Product': 'Tindarr',
            'X-Plex-Client-Identifier': 'tindarr',
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
          'X-Plex-Client-Identifier': 'tindarr',
            'Accept': 'application/json',
          },
        }
      );
    });

    it('should return null if there is no auth token', async () => {
      const timeoutSpy = jest
        .spyOn(global, 'setTimeout')
        .mockImplementation((cb: (...args: any[]) => void) => {
          cb();
          return {} as NodeJS.Timeout;
        });

      mockedAxios.get.mockResolvedValue({
        data: {},
        status: 200,
        statusText: 'OK',
        headers: {},
        config: { url: '' },
      });

      const result = await getAuthToken(123);

      expect(result).toBeNull();
      timeoutSpy.mockRestore();
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

      // Updated call to getMovies
      const result = await getMovies('http://localhost:32400', 'test-token', '1', 'movie', undefined, undefined, undefined, undefined);

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
          params: {
            type: 1, // Added type
          },
        }
      );
    });

    it('should return a list of movies from a library with filters including contentRating', async () => {
      const mockData = {
        MediaContainer: {
          Metadata: [
            { ratingKey: '3', title: 'Movie 1', year: 2020, summary: 'Summary 1', thumb: '/poster1.jpg' },
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

      // Updated call to getMovies
      const result = await getMovies('http://localhost:32400', 'test-token', '1', 'movie', 'Action', 2020, 2020, 'PG-13');

      expect(result).toEqual([
        { key: '3', title: 'Movie 1', year: 2020, summary: 'Summary 1', posterUrl: '/poster1.jpg' },
      ]);
      expect(mockedAxios.get).toHaveBeenCalledWith(
        'http://localhost:32400/library/sections/1/all',
        {
          headers: {
            'X-Plex-Token': 'test-token',
            'Accept': 'application/json',
          },
          params: {
            type: 1, // Added type
            genre: 'Action',
            contentRating: 'PG-13',
          },
        }
      );
    });
    it('maps extended metadata fields', async () => {
      mockedAxios.get.mockResolvedValue({
        data: {
          MediaContainer: {
            Metadata: [
              {
                ratingKey: '10',
                title: 'Rich Metadata',
                year: 2022,
                summary: 'Summary',
                thumb: '/thumb.jpg',
                rating: 8.1,
                originallyAvailableAt: '2022-01-01',
                tagline: 'Tag',
                studio: 'Studio',
                duration: 5400000,
                Genre: [{ tag: 'Drama' }, { tag: 'Comedy' }],
                Country: [{ tag: 'US' }],
                Director: [{ tag: 'Director' }],
                Writer: [{ tag: 'Writer' }],
                Role: [{ tag: 'Actor' }],
                audienceRating: 7.5,
                audienceRatingImage: '/audience.png',
                ratingImage: '/critic.png',
              },
            ],
          },
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: { url: '' },
      });

      const result = await getMovies('http://localhost:32400', 'token', '1', 'movie');

      expect(result).toEqual([
        {
          key: '10',
          title: 'Rich Metadata',
          year: 2022,
          summary: 'Summary',
          posterUrl: '/thumb.jpg',
          rating: 8.1,
          originallyAvailableAt: '2022-01-01',
          tagline: 'Tag',
          studio: 'Studio',
          duration: 5400000,
          genres: ['Drama', 'Comedy'],
          countries: ['US'],
          directors: ['Director'],
          writers: ['Writer'],
          roles: ['Actor'],
          audienceRating: 7.5,
          audienceRatingImage: '/audience.png',
          ratingImage: '/critic.png',
        },
      ]);
    });

    it('applies duration and year filters and sorts by duration', async () => {
      mockedAxios.get.mockResolvedValue({
        data: {
          MediaContainer: {
            Metadata: [
              { ratingKey: '1', title: 'Short', year: 2019, duration: 2000 },
              { ratingKey: '2', title: 'Medium', year: 2021, duration: 4000 },
              { ratingKey: '3', title: 'Long', year: 2022, duration: 6000 },
            ],
          },
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: { url: '' },
      });

      const result = await getMovies(
        'http://localhost:32400',
        'token',
        '1',
        'movie',
        undefined,
        2020,
        2022,
        undefined,
        3000,
        5000,
        'duration:desc'
      );

      expect(result.map(movie => movie.key)).toEqual(['2']);
    });
  });

  describe('getMoviesCount', () => {
    it('filters by year and duration ranges', async () => {
      mockedAxios.get.mockResolvedValue({
        data: {
          MediaContainer: {
            Metadata: [
              { ratingKey: '1', year: 1995, duration: 4000 },
              { ratingKey: '2', year: 2005, duration: 2000 },
              { ratingKey: '3', year: 1998, duration: 1000 },
            ],
          },
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: { url: '' },
      });

      const result = await getMoviesCount(
        'http://localhost:32400',
        'test-token',
        '1',
        'movie',
        'Comedy',
        1990,
        2000,
        'PG',
        3000,
        5000
      );

      expect(result).toBe(1);
      expect(mockedAxios.get).toHaveBeenCalledWith(
        'http://localhost:32400/library/sections/1/all',
        {
          headers: {
            'X-Plex-Token': 'test-token',
            'Accept': 'application/json',
          },
          params: {
            type: 1,
            genre: 'Comedy',
            contentRating: 'PG',
          },
        }
      );
    });
  });
});
