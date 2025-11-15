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

function getPlexTypeInteger(type: 'movie' | 'show'): 1 | 2 {
  return type === 'movie' ? 1 : 2;
}

export async function getLibraryYearRange(
  plexUrl: string,
  plexToken: string,
  libraryKey: string,
  libraryType: 'movie' | 'show'
): Promise<{ minYear: number; maxYear: number } | null> {
  const plexType = getPlexTypeInteger(libraryType);

  let minYear: number | undefined;
  let maxYear: number | undefined;

  try {
    const oldestRequestUrl = `${plexUrl}/library/sections/${libraryKey}/all`;
    const oldestParams = {
      type: plexType,
      sort: 'year:asc',
      limit: 5, // Increased limit to find a valid year
    };
    console.log(`[Plex] Fetching oldest items from ${oldestRequestUrl} with params: ${JSON.stringify(oldestParams)}`);
    const oldestResponse = await axios.get<PlexMovieResponse>(oldestRequestUrl, {
      headers: {
        'X-Plex-Token': plexToken,
        'Accept': 'application/json',
      },
      params: oldestParams,
    });
    console.log(`[Plex] Oldest items response for library ${libraryKey}: ${JSON.stringify(oldestResponse.data)}`);

    if (oldestResponse.data.MediaContainer.Metadata && oldestResponse.data.MediaContainer.Metadata.length > 0) {
      // Find the first item with a valid year
      const oldestMovieWithYear = oldestResponse.data.MediaContainer.Metadata.find(movie => typeof movie.year === 'number');
      if (oldestMovieWithYear) {
        minYear = oldestMovieWithYear.year;
      }
    }

    // Get newest item
    const newestRequestUrl = `${plexUrl}/library/sections/${libraryKey}/all`;
    const newestParams = {
      type: plexType,
      sort: 'year:desc',
      limit: 5, // Increased limit to find a valid year
    };
    console.log(`[Plex] Fetching newest items from ${newestRequestUrl} with params: ${JSON.stringify(newestParams)}`);
    const newestResponse = await axios.get<PlexMovieResponse>(newestRequestUrl, {
      headers: {
        'X-Plex-Token': plexToken,
        'Accept': 'application/json',
      },
      params: newestParams,
    });
    console.log(`[Plex] Newest items response for library ${libraryKey}: ${JSON.stringify(newestResponse.data)}`);

    if (newestResponse.data.MediaContainer.Metadata && newestResponse.data.MediaContainer.Metadata.length > 0) {
      // Find the first item with a valid year
      const newestMovieWithYear = newestResponse.data.MediaContainer.Metadata.find(movie => typeof movie.year === 'number');
      if (newestMovieWithYear) {
        maxYear = newestMovieWithYear.year;
      }
    }

    if (minYear !== undefined && maxYear !== undefined) {
      console.log(`[Plex] Successfully determined year range for library ${libraryKey}: ${minYear}-${maxYear}`); // Added log
      return { minYear, maxYear };
    } else {
      console.warn(`[Plex] Could not determine full year range for library ${libraryKey}. MinYear: ${minYear}, MaxYear: ${maxYear}`); // Added log
    }
  } catch (error: any) {
    console.error(`Failed to get year range for library ${libraryKey}:`, error.message);
    if (error.response) {
      console.error(`Plex API response status: ${error.response.status}`);
      console.error(`Plex API response data: ${JSON.stringify(error.response.data)}`);
    }
  }

  return null;
}

export async function getMovies(
  plexUrl: string,
  plexToken: string,
  libraryKey: string,
  libraryType: 'movie' | 'show', // New parameter
  genre?: string,
  yearMin?: number,
  yearMax?: number,
  contentRating?: string
): Promise<Movie[]> {
  const params: Record<string, any> = {};
  params.type = getPlexTypeInteger(libraryType); // Add type parameter
  if (genre) params.genre = genre;
  if (yearMin) params['year.gte'] = yearMin;
  if (yearMax) params['year.lte'] = yearMax;
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

interface PlexGenreResponse {
  MediaContainer: {
    Directory: { // Corrected from 'Genre' to 'Directory'
      key: string;
      title: string;
      type: 'genre';
    }[];
  };
}

export async function getGenres(
  plexUrl: string,
  plexToken: string,
  libraryKeys: string[]
): Promise<string[]> {
  const allGenres = new Set<string>();

  for (const libraryKey of libraryKeys) {
    try {
      const requestUrl = `${plexUrl}/library/sections/${libraryKey}/genre`;
      const response = await axios.get<PlexGenreResponse>(requestUrl, {
        headers: {
          'X-Plex-Token': plexToken,
          'Accept': 'application/json',
        },
      });

      if (response.data && response.data.MediaContainer && response.data.MediaContainer.Directory) {
        response.data.MediaContainer.Directory.forEach(genre => {
          allGenres.add(genre.title);
        });
      } else {
        // No genres found, continue without warning
      }
    } catch (error: any) {
      console.error(`Failed to get genres for library ${libraryKey}:`, error.message);
      if (error.response) {
        console.error(`Plex API response status: ${error.response.status}`);
        console.error(`Plex API response data: ${JSON.stringify(error.response.data)}`);
      }
      // Continue to the next library even if one fails
    }
  }

  return Array.from(allGenres).sort();
}

export async function getMoviesCount(
  plexUrl: string,
  plexToken: string,
  libraryKey: string, // Changed from libraryKeys: string[]
  libraryType: 'movie' | 'show', // New parameter
  genre?: string,
  yearMin?: number,
  yearMax?: number,
  contentRating?: string
): Promise<number> {
  const params: Record<string, any> = {};
  params.type = getPlexTypeInteger(libraryType); // Add type parameter
  if (genre) params.genre = genre;
  if (yearMin) params['year.gte'] = yearMin;
  if (yearMax) params['year.lte'] = yearMax;
  if (contentRating) params.contentRating = contentRating;

  const requestUrl = `${plexUrl}/library/sections/${libraryKey}/all`;
  // console.log(`Fetching movie count from Plex: ${requestUrl} with params: ${JSON.stringify(params)}`); // Reverted log

  const response = await axios.get<PlexMovieResponse>(requestUrl, {
    headers: {
      'X-Plex-Token': plexToken,
      'Accept': 'application/json',
    },
    params,
  });

  // console.log(`Plex movie count response for library ${libraryKey}:`, JSON.stringify(response.data)); // Reverted log
  if (response.data && response.data.MediaContainer && response.data.MediaContainer.Metadata) {
    return response.data.MediaContainer.Metadata.length;
  }

  return 0;
}