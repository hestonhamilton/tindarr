import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

interface MovieCountParams {
  plexUrl: string;
  plexToken: string;
  libraryKeys: string[];
  genre?: string;
  yearMin?: number;
  yearMax?: number;
  contentRating?: string;
}

export function useMovieCount(params: MovieCountParams) {
  const { plexUrl, plexToken, libraryKeys, genre, yearMin, yearMax, contentRating } = params;

  return useQuery<number, Error>({
    queryKey: ['movieCount', plexUrl, plexToken, libraryKeys, genre, yearMin, yearMax, contentRating],
    queryFn: async () => {
      if (!plexUrl || !plexToken || libraryKeys.length === 0) {
        return 0;
      }
      const response = await axios.get<{ count: number }>('/api/plex/movies/count', {
        params: {
          plexUrl,
          plexToken,
          libraryKeys: libraryKeys.join(','), // Send as comma-separated string
          genre,
          yearMin,
          yearMax,
          contentRating,
        },
      });
      return response.data.count;
    },
    enabled: !!plexUrl && !!plexToken && libraryKeys.length > 0,
  });
}
