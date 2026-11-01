import { buildCuratedDeck } from './curatedDeck';

it('matches title punctuation and case, tolerates one year, skips missing titles, and shuffles with injected RNG', () => {
  const deck = buildCuratedDeck(
    [
      { title: 'Scooby-Doo on Zombie Island', year: 1998 },
      { title: 'Halloween', year: 1978 },
      { title: 'Missing', year: 2000 },
      { title: 'Coco', year: 2017 },
    ],
    [
      { key: '1', title: 'SCOOBY DOO: ON ZOMBIE ISLAND!', year: 1999 },
      { key: '2', title: 'halloween', year: 1981 },
      { key: '3', title: 'Halloween', year: 1978 },
      { key: '4', title: 'Coco', year: 2016 },
    ],
    () => 0,
  );

  expect(deck.map(movie => movie.key)).toEqual(['3', '4', '1']);
});
