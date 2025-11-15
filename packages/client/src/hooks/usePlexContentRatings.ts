// packages/client/src/hooks/usePlexContentRatings.ts
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { SelectedLibrary } from '../types';

interface UsePlexContentRatingsProps {
  plexUrl: string;
  plexToken: string;
  selectedLibraries: SelectedLibrary[];
}

export const usePlexContentRatings = ({ plexUrl, plexToken, selectedLibraries }: UsePlexContentRatingsProps) => {
  const libraryKeys = selectedLibraries.map(lib => lib.key);
  const queryKey = ['plexContentRatings', plexUrl, plexToken, libraryKeys];

  return useQuery<string[], Error>({
    queryKey: queryKey,
    queryFn: async () => {
      if (!plexUrl || !plexToken || libraryKeys.length === 0) {
        return [];
      }

      const response = await axios.get<string[]>(`/api/plex/contentRatings`, {
        params: {
          plexUrl,
          plexToken,
          libraryKeys: libraryKeys.join(','),
        },
      });
      return response.data;
    },
    enabled: !!plexUrl && !!plexToken && libraryKeys.length > 0,
  });
};
