import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

interface PlexGenresParams {
  plexUrl: string;
  plexToken: string;
  libraryKeys: string[];
}

export function usePlexGenres(params: PlexGenresParams) {
  const { plexUrl, plexToken, libraryKeys } = params;
  const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

  return useQuery<string[], Error>({
    queryKey: ['plexGenres', plexUrl, plexToken, libraryKeys],
    queryFn: async () => {
      if (!plexUrl || !plexToken || libraryKeys.length === 0) {
        return [];
      }
      const response = await axios.get<string[]>(`${backendUrl}/api/plex/genres`, {
        params: {
          plexUrl,
          plexToken,
          libraryKeys: libraryKeys.join(','), // Send as comma-separated string
        },
      });
      return response.data;
    },
    enabled: !!plexUrl && !!plexToken && libraryKeys.length > 0,
  });
}
