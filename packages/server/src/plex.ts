import axios from 'axios';
import { parseStringPromise } from 'xml2js';

import { Movie } from './types';

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
      year?: number; // Made optional
      summary?: string; // Made optional
      thumb?: string; // Made optional
      contentRating?: string;
      rating?: number;
      originallyAvailableAt?: string;
      tagline?: string; // New
      studio?: string; // New
      duration?: number; // New
      Genre?: { tag: string }[]; // New
      Country?: { tag: string }[]; // New
      Director?: { tag: string }[]; // New
      Writer?: { tag: string }[]; // New
      Role?: { tag: string }[]; // New
      audienceRating?: number; // New
      audienceRatingImage?: string; // New
      ratingImage?: string; // New
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
      limit: 5,
    };
    const oldestResponse = await axios.get<PlexMovieResponse>(oldestRequestUrl, {
      headers: {
        'X-Plex-Token': plexToken,
        'Accept': 'application/json',
      },
      params: oldestParams,
    });

    if (oldestResponse.data.MediaContainer.Metadata && oldestResponse.data.MediaContainer.Metadata.length > 0) {
      const oldestMovieWithYear = oldestResponse.data.MediaContainer.Metadata.find(movie => typeof movie.year === 'number');
      if (oldestMovieWithYear) {
        minYear = oldestMovieWithYear.year;
      }
    }

    const newestRequestUrl = `${plexUrl}/library/sections/${libraryKey}/all`;
    const newestParams = {
      type: plexType,
      sort: 'year:desc',
      limit: 5,
    };
    const newestResponse = await axios.get<PlexMovieResponse>(newestRequestUrl, {
      headers: {
        'X-Plex-Token': plexToken,
        'Accept': 'application/json',
      },
      params: newestParams,
    });

    if (newestResponse.data.MediaContainer.Metadata && newestResponse.data.MediaContainer.Metadata.length > 0) {
      const newestMovieWithYear = newestResponse.data.MediaContainer.Metadata.find(movie => typeof movie.year === 'number');
      if (newestMovieWithYear) {
        maxYear = newestMovieWithYear.year;
      }
    }

    if (minYear !== undefined && maxYear !== undefined) {
      console.log(`[Plex] Successfully determined year range for library ${libraryKey}: ${minYear}-${maxYear}`);
      return { minYear, maxYear };
    } else {
      console.warn(`[Plex] Could not determine full year range for library ${libraryKey}. MinYear: ${minYear}, MaxYear: ${maxYear}`);
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

// Helper function for shuffling an array (Fisher-Yates algorithm)
function shuffleArray<T>(array: T[]): T[] {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

export async function getMovies(
  plexUrl: string,
  plexToken: string,
  libraryKey: string,
  libraryType: 'movie' | 'show',
  genre?: string,
  yearMin?: number,
  yearMax?: number,
  contentRating?: string,
  durationMin?: number, // New parameter
  durationMax?: number, // New parameter
  sortOrder: string = 'title:asc'
): Promise<Movie[]> {
  const params: Record<string, any> = {};
  params.type = getPlexTypeInteger(libraryType);
  if (genre) params.genre = genre;
  if (contentRating) params.contentRating = contentRating;

  const requestUrl = `${plexUrl}/library/sections/${libraryKey}/all`;

  try {
    const response = await axios.get<PlexMovieResponse>(requestUrl, {
      headers: {
        'X-Plex-Token': plexToken,
        'Accept': 'application/json',
      },
      params,
    });

    if (response.data && response.data.MediaContainer && response.data.MediaContainer.Metadata) {
      let filteredMetadata = response.data.MediaContainer.Metadata;

      // Apply server-side year filtering
      if (yearMin !== undefined) {
        filteredMetadata = filteredMetadata.filter(movie => movie.year !== undefined && movie.year >= yearMin);
      }
      if (yearMax !== undefined) {
        filteredMetadata = filteredMetadata.filter(movie => movie.year !== undefined && movie.year <= yearMax);
      }

      // Apply server-side duration filtering (new)
      if (durationMin !== undefined) {
        filteredMetadata = filteredMetadata.filter(movie => movie.duration !== undefined && movie.duration >= durationMin);
      }
      if (durationMax !== undefined) {
        filteredMetadata = filteredMetadata.filter(movie => movie.duration !== undefined && movie.duration <= durationMax);
      }

      let movies = filteredMetadata.map((movie) => ({
        key: movie.ratingKey,
        title: movie.title,
        year: movie.year,
        summary: movie.summary,
        posterUrl: movie.thumb,
        rating: movie.rating,
        originallyAvailableAt: movie.originallyAvailableAt,
        tagline: movie.tagline, // New
        studio: movie.studio, // New
        duration: movie.duration, // New
        genres: movie.Genre?.map(g => g.tag), // New, map to string[]
        countries: movie.Country?.map(c => c.tag), // New, map to string[]
        directors: movie.Director?.map(d => d.tag), // New, map to string[]
        writers: movie.Writer?.map(w => w.tag), // New, map to string[]
        roles: movie.Role?.map(r => r.tag), // New, map to string[]
        audienceRating: movie.audienceRating, // New
        audienceRatingImage: movie.audienceRatingImage, // New
        ratingImage: movie.ratingImage, // New
      }));

      // Apply sorting
      if (sortOrder === 'random') {
        movies = shuffleArray(movies);
      } else {
        const [sortBy, sortDirection] = sortOrder.split(':');
        movies.sort((a, b) => {
          let valA: any;
          let valB: any;

          switch (sortBy) {
            case 'title':
              valA = a.title.toLowerCase();
              valB = b.title.toLowerCase();
              break;
            case 'originallyAvailableAt':
              valA = new Date(a.originallyAvailableAt || 0).getTime(); // Use 0 for missing dates
              valB = new Date(b.originallyAvailableAt || 0).getTime();
              break;
            case 'rating':
              valA = a.rating || 0; // Use 0 for missing ratings
              valB = b.rating || 0;
              break;
            default:
              return 0;
          }

          if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
          if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
          return 0;
        });
      }

      return movies;
    }
  } catch (error: any) {
    console.error(`[Plex] Failed to get movies for library ${libraryKey}:`, error.message);
    if (error.response) {
      console.error(`[Plex] Plex API response status: ${error.response.status}`);
      console.error(`[Plex] Plex API response data: ${JSON.stringify(error.response.data)}`);
    }
  }

  return [];
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

export async function getContentRatings(
  plexUrl: string,
  plexToken: string,
  libraryKeys: string[]
): Promise<string[]> {
  const allContentRatings = new Set<string>();

  for (const libraryKey of libraryKeys) {
    try {
      const requestUrl = `${plexUrl}/library/sections/${libraryKey}/all`;

      const response = await axios.get<PlexMovieResponse>(requestUrl, {
        headers: {
          'X-Plex-Token': plexToken,
          'Accept': 'application/json',
        },
        params: {
          type: getPlexTypeInteger('movie'),
        },
      });

      if (response.data && response.data.MediaContainer && response.data.MediaContainer.Metadata) {
        response.data.MediaContainer.Metadata.forEach(movie => {
          if (movie.contentRating) {
            allContentRatings.add(movie.contentRating);
          }
        });
      } else {
        console.warn(`[Plex] No movies found or unexpected response for content ratings in library ${libraryKey}.`);
      }
    } catch (error: any) {
      console.error(`[Plex] Failed to get content ratings for library ${libraryKey}:`, error.message);
      if (error.response) {
        console.error(`[Plex] Plex API response status: ${error.response.status}`);
        console.error(`[Plex] Plex API response data: ${JSON.stringify(error.response.data)}`);
      }
    }
  }

  return Array.from(allContentRatings).sort();
}

export async function getMoviesCount(
  plexUrl: string,
  plexToken: string,
  libraryKey: string, // Changed from libraryKeys: string[]
  libraryType: 'movie' | 'show', // New parameter
  genre?: string,
  yearMin?: number,
  yearMax?: number,
  contentRating?: string,
  durationMin?: number, // New parameter
  durationMax?: number // New parameter
): Promise<number> {
  const params: Record<string, any> = {};
  params.type = getPlexTypeInteger(libraryType); // Add type parameter
  if (genre) params.genre = genre;
  // Removed yearMin and yearMax from params sent to Plex API
  if (contentRating) params.contentRating = contentRating;

  const requestUrl = `${plexUrl}/library/sections/${libraryKey}/all`;

  try {
    const response = await axios.get<PlexMovieResponse>(requestUrl, {
      headers: {
        'X-Plex-Token': plexToken,
        'Accept': 'application/json',
      },
      params,
    });

    if (response.data && response.data.MediaContainer && response.data.MediaContainer.Metadata) {
      let filteredMovies = response.data.MediaContainer.Metadata;

      // Apply server-side year filtering
      if (yearMin !== undefined) {
        filteredMovies = filteredMovies.filter(movie => movie.year !== undefined && movie.year >= yearMin);
      }
      if (yearMax !== undefined) {
        filteredMovies = filteredMovies.filter(movie => movie.year !== undefined && movie.year <= yearMax);
      }

      // Apply server-side duration filtering (new)
      if (durationMin !== undefined) {
        filteredMovies = filteredMovies.filter(movie => movie.duration !== undefined && movie.duration >= durationMin);
      }
      if (durationMax !== undefined) {
        filteredMovies = filteredMovies.filter(movie => movie.duration !== undefined && movie.duration <= durationMax);
      }

      return filteredMovies.length;
    }
  } catch (error: any) {
    console.error(`[Plex] Failed to get movie count for library ${libraryKey}:`, error.message);
    if (error.response) {
      console.error(`[Plex] Plex API response status: ${error.response.status}`);
      console.error(`[Plex] Plex API response data: ${JSON.stringify(error.response.data)}`);
    }
  }

  return 0;
}