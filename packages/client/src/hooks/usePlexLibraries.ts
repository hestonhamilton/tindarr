import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Library } from '../types';

export function usePlexLibraries() {
  const plexUrl = localStorage.getItem('plexUrl');
  const plexToken = localStorage.getItem('plexToken');

  return useQuery<Library[], Error>({
    queryKey: ['plexLibraries', plexUrl, plexToken],
    queryFn: async () => {
      if (!plexUrl || !plexToken) {
        throw new Error('Plex URL or token not found in local storage.');
      }
      const response = await axios.get<Library[]>('/api/plex/libraries', {
        params: { plexUrl, plexToken },
      });
      return response.data;
    },
    enabled: !!plexUrl && !!plexToken, // Only run the query if plexUrl and plexToken are available
  });
}
