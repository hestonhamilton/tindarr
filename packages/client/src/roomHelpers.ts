import { Movie, Room } from './types';

export function getResumeIndex(movies: Movie[], savedKey: string | null): number {
  if (savedKey === '__done__') return movies.length;
  const index = movies.findIndex(movie => movie.key === savedKey);
  return index < 0 ? 0 : index;
}

export function getTally(movies: Movie[], room: Pick<Room, 'movieLikes' | 'likedMovies' | 'users'>) {
  const matched = new Set(room.likedMovies.map(movie => movie.key));
  const present = new Set(room.users.map(user => user.id));
  return movies.map(movie => ({ movie, count: room.movieLikes[movie.key]?.filter(id => present.has(id)).length ?? 0, matched: matched.has(movie.key) }))
    .filter(entry => entry.count > 0)
    .sort((a, b) => Number(b.matched) - Number(a.matched) || b.count - a.count || a.movie.title.localeCompare(b.movie.title));
}
