import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Movie } from '../types';

interface PlexMoviesParams {
  plexUrl: string;
  plexToken: string;
  libraryKey: string;
  genre?: string;
  yearMin?: number;
  yearMax?: number;
  contentRating?: string;
}

export function usePlexMovies(params: PlexMoviesParams) {
  const { plexUrl, plexToken, libraryKey, genre, yearMin, yearMax, contentRating } = params;

  return useQuery<Movie[], Error>({
    queryKey: ['plexMovies', plexUrl, plexToken, libraryKey, genre, yearMin, yearMax, contentRating],
    queryFn: async () => {
      if (!plexUrl || !plexToken || !libraryKey) {
        return [];
      }
      const response = await axios.get<Movie[]>('/api/plex/movies', {
        params: {
          plexUrl,
          plexToken,
          libraryKey,
          genre,
          yearMin,
          yearMax,
          contentRating,
        },
      });
      return response.data;
    },
    enabled: !!plexUrl && !!plexToken && !!libraryKey,
  });
}
