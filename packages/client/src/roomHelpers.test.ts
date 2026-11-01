import { describe, expect, it } from 'vitest';
import { getResumeIndex, getTally } from './roomHelpers';
import { Movie } from './types';

const movies: Movie[] = [{ key: 'a', title: 'Alpha' }, { key: 'b', title: 'Beta' }, { key: 'c', title: 'Charlie' }];

describe('room helpers', () => {
  it('resumes by key, including the completed deck', () => {
    expect(getResumeIndex(movies, 'b')).toBe(1);
    expect(getResumeIndex(movies, 'missing')).toBe(0);
    expect(getResumeIndex(movies, '__done__')).toBe(3);
  });
  it('shows matches first, then sorts remaining likes by count', () => {
    const tally = getTally(movies, { movieLikes: { a: ['1', '2', 'departed'], b: ['1'], c: ['1', '2', '3'] }, likedMovies: [movies[1]], users: ['1', '2', '3'].map(id => ({ id, name: id })) });
    expect(tally.map(item => item.movie.key)).toEqual(['b', 'c', 'a']);
    expect(tally.find(item => item.movie.key === 'a')?.count).toBe(2);
  });
});
