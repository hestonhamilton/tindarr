import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Movie } from '../types';

interface PlexMoviesParams {
  plexUrl: string;
  plexToken: string;
  libraryKeys: string[]; // Changed from libraryKey: string
  genre?: string;
  yearMin?: number;
  yearMax?: number;
  contentRating?: string;
}

export function usePlexMovies(params: PlexMoviesParams) {
  const { plexUrl, plexToken, libraryKeys, genre, yearMin, yearMax, contentRating } = params;

  return useQuery<Movie[], Error>({
    queryKey: ['plexMovies', plexUrl, plexToken, libraryKeys, genre, yearMin, yearMax, contentRating],
    queryFn: async () => {
      if (!plexUrl || !plexToken || libraryKeys.length === 0) { // Check for empty libraryKeys array
        return [];
      }

      const allMovies: Movie[] = [];
      for (const key of libraryKeys) {
        const response = await axios.get<Movie[]>('/api/plex/movies', {
          params: {
            plexUrl,
            plexToken,
            libraryKey: key, // Pass individual library key
            genre,
            yearMin,
            yearMax,
            contentRating,
          },
        });
        allMovies.push(...response.data);
      }
      return allMovies;
    },
    enabled: !!plexUrl && !!plexToken && libraryKeys.length > 0, // Enable only if libraryKeys is not empty
  });
}
