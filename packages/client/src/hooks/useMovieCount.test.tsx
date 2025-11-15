import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import axios from 'axios';
import type { PropsWithChildren } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useMovieCount } from './useMovieCount';

vi.mock('axios');
const mockedAxios = vi.mocked(axios, true);

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  const Wrapper = ({ children }: PropsWithChildren) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  return { wrapper: Wrapper, queryClient };
};

describe('useMovieCount', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('requests counts with selected libraries and filters applied', async () => {
    mockedAxios.get.mockResolvedValue({
      data: { count: 7 },
    } as any);
    const libraries = [{ key: '1', type: 'movie' }];
    const { wrapper, queryClient } = createWrapper();

    const { result } = renderHook(
      () =>
        useMovieCount({
          plexUrl: 'http://localhost:32400',
          plexToken: 'token',
          selectedLibraries: libraries,
          genre: 'Action',
          yearMin: 2000,
          yearMax: 2020,
          contentRating: 'PG-13',
          durationMin: 600000,
          durationMax: 900000,
        }),
      { wrapper }
    );

    await waitFor(() => expect(result.current.data).toBe(7));

    expect(mockedAxios.get).toHaveBeenCalledWith('/api/plex/movies/count', {
      params: {
        plexUrl: 'http://localhost:32400',
        plexToken: 'token',
        selectedLibraries: JSON.stringify(libraries),
        genre: 'Action',
        yearMin: 2000,
        yearMax: 2020,
        contentRating: 'PG-13',
        durationMin: 600000,
        durationMax: 900000,
      },
    });

    queryClient.clear();
  });

  it('skips fetching when no libraries are selected', async () => {
    const { wrapper, queryClient } = createWrapper();

    renderHook(
      () =>
        useMovieCount({
          plexUrl: 'http://localhost:32400',
          plexToken: 'token',
          selectedLibraries: [],
        }),
      { wrapper }
    );

    await waitFor(() => expect(mockedAxios.get).not.toHaveBeenCalled());
    queryClient.clear();
  });
});
