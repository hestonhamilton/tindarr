import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import axios from 'axios';
import type { PropsWithChildren } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { usePlexMovies } from './usePlexMovies';

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

describe('usePlexMovies', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('fetches movies using selected libraries and filters', async () => {
    const libraries = [{ key: '1', type: 'movie' as const }];
    mockedAxios.get.mockResolvedValue({
      data: [{ key: 'abc', title: 'Test Movie' }],
    } as any);

    const { wrapper, queryClient } = createWrapper();
    const { result } = renderHook(
      () =>
        usePlexMovies({
          plexUrl: 'http://localhost:32400',
          plexToken: 'token',
          selectedLibraries: libraries,
          genre: 'Action',
          yearMin: 2000,
          yearMax: 2020,
          contentRating: 'PG-13',
          durationMin: 600000,
          durationMax: 900000,
          sortOrder: 'duration:asc',
        }),
      { wrapper }
    );

    await waitFor(() =>
      expect(result.current.data).toEqual([{ key: 'abc', title: 'Test Movie' }])
    );

    expect(mockedAxios.get).toHaveBeenCalledWith('/api/plex/movies', {
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
        sortOrder: 'duration:asc',
      },
    });

    queryClient.clear();
  });

  it('returns empty array when libraries are missing', async () => {
    const { wrapper, queryClient } = createWrapper();

    const { result } = renderHook(
      () =>
        usePlexMovies({
          plexUrl: 'http://localhost:32400',
          plexToken: 'token',
          selectedLibraries: [],
        }),
      { wrapper }
    );

    await waitFor(() => expect(result.current.data).toBeUndefined());
    expect(mockedAxios.get).not.toHaveBeenCalled();
    queryClient.clear();
  });
});
