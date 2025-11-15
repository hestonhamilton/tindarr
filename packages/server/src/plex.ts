import axios from 'axios';
import { parseStringPromise } from 'xml2js';

const PLEX_API_BASE_URL = 'https://plex.tv/api/v2';

export interface Pin {
  id: number;
  code: string;
}

export interface Library {
  key: string;
  title: string;
  type: 'movie' | 'show';
}

export interface Movie {
  key: string;
  title: string;
  year: number;
  summary: string;
  posterUrl: string;
}

interface PlexLibraryResponse {
  MediaContainer: {
    Directory: {
      key: string;
      title: string;
      type: 'movie' | 'show';
    }[];
  };
}

interface PlexMovieResponse {
  MediaContainer: {
    Metadata: {
      ratingKey: string;
      title: string;
      year: number;
      summary: string;
      thumb: string;
    }[];
  };
}

export async function getNewPin(): Promise<Pin> {
  const response = await axios.post<Pin>(
    `${PLEX_API_BASE_URL}/pins?strong=true`,
    null,
    {
      headers: {
        'X-Plex-Product': 'MovieMatch',
        'X-Plex-Client-Identifier': 'moviematch-v2',
        'Accept': 'application/json',
      },
    }
  );

  return response.data;
}

export async function getAuthToken(pinId: number): Promise<string | null> {
  const MAX_POLLING_ATTEMPTS = 30; // Poll for 30 * 2 seconds = 1 minute
  const POLLING_INTERVAL_MS = 2000; // 2 seconds

  for (let i = 0; i < MAX_POLLING_ATTEMPTS; i++) {
    try {
      const response = await axios.get<{ authToken: string; code: string; id: number; product: string; trusted: boolean; expiresAt: string; createdAt: string; clientIdentifier: string; newRegistration: boolean; }>
      (`${PLEX_API_BASE_URL}/pins/${pinId}`, {
        headers: {
          'X-Plex-Client-Identifier': 'moviematch-v2',
          'Accept': 'application/json',
        },
      });

      if (response.data.authToken) {
        return response.data.authToken;
      }
    } catch (error: any) {
      // Log error but continue polling if it's not a critical error
      // For example, a 404 might mean the pin is not yet authorized, so we continue polling.
      if (error.response && error.response.status === 404) {
        console.warn(`Polling for Plex token (pinId: ${pinId}) - not yet authorized (attempt ${i + 1}).`);
      } else {
        console.error(`Polling for Plex token failed (pinId: ${pinId}, attempt ${i + 1}):`, error.message);
      }
    }

    await new Promise(resolve => setTimeout(resolve, POLLING_INTERVAL_MS));
  }

  return null; // Token not found after max attempts
}

export async function getLibraries(
  plexUrl: string,
  plexToken: string
): Promise<Library[]> {
  const response = await axios.get<PlexLibraryResponse>(`${plexUrl}/library/sections`, {
    headers: {
      'X-Plex-Token': plexToken,
      'Accept': 'application/json',
    },
  });

  const libraries = response.data.MediaContainer.Directory.map((dir) => ({
    key: dir.key,
    title: dir.title,
    type: dir.type,
  }));

  return libraries;
}

export async function getMovies(
  plexUrl: string,
  plexToken: string,
  libraryKey: string,
  genre?: string,
  yearMin?: number,
  yearMax?: number,
  contentRating?: string
): Promise<Movie[]> {
  const params: Record<string, any> = {};
  if (genre) params.genre = genre;
  if (yearMin) params['year>='] = yearMin;
  if (yearMax) params['year<='] = yearMax;
  if (contentRating) params.contentRating = contentRating;

  const response = await axios.get<PlexMovieResponse>(`${plexUrl}/library/sections/${libraryKey}/all`, {
    headers: {
      'X-Plex-Token': plexToken,
      'Accept': 'application/json',
    },
    params,
  });

  const movies = response.data.MediaContainer.Metadata.map((movie) => ({
    key: movie.ratingKey,
    title: movie.title,
    year: movie.year,
    summary: movie.summary,
    posterUrl: movie.thumb,
  }));

  return movies;
}

export async function getMoviesCount(
  plexUrl: string,
  plexToken: string,
  libraryKeys: string[],
  genre?: string,
  yearMin?: number,
  yearMax?: number,
  contentRating?: string
): Promise<number> {
  let totalCount = 0;

  for (const libraryKey of libraryKeys) {
    const params: Record<string, any> = {};
    if (genre) params.genre = genre;
    if (yearMin) params['year>='] = yearMin;
    if (yearMax) params['year<='] = yearMax;
    if (contentRating) params.contentRating = contentRating;

    const response = await axios.get<PlexMovieResponse>(`${plexUrl}/library/sections/${libraryKey}/all`, {
      headers: {
        'X-Plex-Token': plexToken,
        'Accept': 'application/json',
      },
      params,
    });
    totalCount += response.data.MediaContainer.Metadata.length;
  }

  return totalCount;
}