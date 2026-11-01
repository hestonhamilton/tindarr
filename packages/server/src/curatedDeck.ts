import { CuratedTitle } from './halloween';
import { Movie } from './types';

const normalizeTitle = (title: string) => title.toLowerCase().replace(/[^a-z0-9]/g, '');

export function buildCuratedDeck(
  titles: CuratedTitle[],
  libraryMovies: Movie[],
  rng: () => number = Math.random,
): Movie[] {
  const moviesByTitle = new Map<string, Movie[]>();
  for (const movie of libraryMovies) {
    const title = normalizeTitle(movie.title);
    const matches = moviesByTitle.get(title) ?? [];
    matches.push(movie);
    moviesByTitle.set(title, matches);
  }

  const usedKeys = new Set<string>();
  const deck: Movie[] = [];
  for (const title of titles) {
    const match = (moviesByTitle.get(normalizeTitle(title.title)) ?? [])
      .filter(movie => !usedKeys.has(movie.key) && movie.year !== undefined && Math.abs(movie.year - title.year) <= 1)
      .sort((a, b) => Math.abs(a.year! - title.year) - Math.abs(b.year! - title.year))[0];
    if (match) {
      deck.push(match);
      usedKeys.add(match.key);
    }
  }

  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}
