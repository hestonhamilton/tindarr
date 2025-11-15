import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { SelectedLibrary } from '../types';

interface PlexYearRangeParams {
  plexUrl: string;
  plexToken: string;
  selectedLibraries: SelectedLibrary[];
}

interface YearRange {
  minYear: number | null;
  maxYear: number | null;
}

export function usePlexYearRange(params: PlexYearRangeParams) {
  const { plexUrl, plexToken, selectedLibraries } = params;

  return useQuery<YearRange, Error>({
    queryKey: ['plexYearRange', plexUrl, plexToken, selectedLibraries],
    queryFn: async () => {
      if (!plexUrl || !plexToken || selectedLibraries.length === 0) {
        return { minYear: null, maxYear: null };
      }
      const response = await axios.get<YearRange>('/api/plex/years/range', {
        params: {
          plexUrl,
          plexToken,
          selectedLibraries: JSON.stringify(selectedLibraries),
        },
      });
      return response.data;
    },
    enabled: !!plexUrl && !!plexToken && selectedLibraries.length > 0,
  });
}
