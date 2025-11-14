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
  const response = await axios.get<{ authToken: string }>(`${PLEX_API_BASE_URL}/pins/${pinId}`, {
    headers: {
      'X-Plex-Client-Identifier': 'moviematch-v2',
      'Accept': 'application/json',
    },
  });

  return response.data.authToken ?? null;
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
  libraryKey: string
): Promise<Movie[]> {
  const response = await axios.get<PlexMovieResponse>(`${plexUrl}/library/sections/${libraryKey}/all`, {
    headers: {
      'X-Plex-Token': plexToken,
      'Accept': 'application/json',
    },
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