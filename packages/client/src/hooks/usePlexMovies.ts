import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Movie, SelectedLibrary } from '../types'; // Import SelectedLibrary

interface PlexMoviesParams {
  plexUrl: string;
  plexToken: string;
  selectedLibraries: SelectedLibrary[];
  genre?: string;
  yearMin?: number;
  yearMax?: number;
  contentRating?: string;
  durationMin?: number; // New
  durationMax?: number; // New
  sortOrder?: string; // Added sortOrder
}

export function usePlexMovies(params: PlexMoviesParams) {
  const { plexUrl, plexToken, selectedLibraries, genre, yearMin, yearMax, contentRating, durationMin, durationMax, sortOrder } = params; // Destructure sortOrder

  return useQuery<Movie[], Error>({
    queryKey: ['plexMovies', plexUrl, plexToken, selectedLibraries, genre, yearMin, yearMax, contentRating, durationMin, durationMax, sortOrder], // Added sortOrder to queryKey
    queryFn: async () => {
      if (!plexUrl || !plexToken || selectedLibraries.length === 0) {
        return [];
      }

      const response = await axios.get<Movie[]>('/api/plex/movies', {
        params: {
          plexUrl,
          plexToken,
          // Send selectedLibraries as a JSON string
          selectedLibraries: JSON.stringify(selectedLibraries),
          genre,
          yearMin,
          yearMax,
          contentRating,
          durationMin, // Pass durationMin
          durationMax, // Pass durationMax
          sortOrder, // Pass sortOrder
        },
      });
      return response.data; // The server will return all movies combined
    },
    enabled: !!plexUrl && !!plexToken && selectedLibraries.length > 0,
  });
}
