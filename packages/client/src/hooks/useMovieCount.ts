import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { SelectedLibrary } from '../types'; // Import SelectedLibrary

interface MovieCountParams {
  plexUrl: string;
  plexToken: string;
  selectedLibraries: SelectedLibrary[]; // Changed from libraryKeys: string[]
  genre?: string;
  yearMin?: number;
  yearMax?: number;
  contentRating?: string;
  durationMin?: number; // New
  durationMax?: number; // New
}

export function useMovieCount(params: MovieCountParams) {
  const {
    plexUrl,
    plexToken,
    selectedLibraries,
    genre,
    yearMin,
    yearMax,
    contentRating,
    durationMin,
    durationMax,
  } = params;

  return useQuery<number, Error>({
    queryKey: [
      'movieCount',
      plexUrl,
      plexToken,
      selectedLibraries,
      genre,
      yearMin,
      yearMax,
      contentRating,
      durationMin,
      durationMax,
    ],
    queryFn: async () => {
      if (!plexUrl || !plexToken || selectedLibraries.length === 0) {
        return 0;
      }
      const response = await axios.get<{ count: number }>('/api/plex/movies/count', {
        params: {
          plexUrl,
          plexToken,
          // Send selectedLibraries as a JSON string
          selectedLibraries: JSON.stringify(selectedLibraries),
          genre,
          yearMin,
          yearMax,
          contentRating,
          durationMin,
          durationMax,
        },
      });
      return response.data.count;
    },
    enabled: !!plexUrl && !!plexToken && selectedLibraries.length > 0,
  });
}
