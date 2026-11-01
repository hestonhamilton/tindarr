// Halloween movie night candidates. Thematic rather than strictly horror: a mix of
// spooky-fun, horror comedy, gothic/mystery, classics and modern horror, so a group with
// different scare tolerances still finds overlap. Drawn from the usual "best Halloween
// movies" canon and matched against the Plex library by title + year at runtime; titles
// the library doesn't have are skipped, never requested.
export interface CuratedTitle {
  title: string;
  year: number;
}

export const HALLOWEEN_TITLES: CuratedTitle[] = [
  // Spooky fun
  { title: 'Beetlejuice', year: 1988 },
  { title: 'Ghostbusters', year: 1984 },
  { title: 'The Nightmare Before Christmas', year: 1993 },
  { title: 'Corpse Bride', year: 2005 },
  { title: 'Edward Scissorhands', year: 1990 },
  { title: 'Gremlins', year: 1984 },
  { title: 'Little Shop of Horrors', year: 1986 },
  { title: 'Scooby-Doo on Zombie Island', year: 1998 },
  { title: 'Coco', year: 2017 },
  { title: 'Spirited Away', year: 2001 },
  // Horror comedy
  { title: 'Shaun of the Dead', year: 2004 },
  { title: 'What We Do in the Shadows', year: 2014 },
  { title: 'The Cabin in the Woods', year: 2012 },
  { title: 'Evil Dead 2', year: 1987 },
  { title: 'Young Frankenstein', year: 1974 },
  { title: 'The Rocky Horror Picture Show', year: 1975 },
  { title: 'Ready or Not', year: 2019 },
  { title: 'Zombieland', year: 2009 },
  { title: 'Freaky', year: 2020 },
  { title: 'Drag Me to Hell', year: 2009 },
  { title: 'Lisa Frankenstein', year: 2024 },
  { title: 'Slither', year: 2006 },
  // Gothic, mystery and thrillers
  { title: 'Clue', year: 1985 },
  { title: 'The Sixth Sense', year: 1999 },
  { title: 'The Others', year: 2001 },
  { title: 'Crimson Peak', year: 2015 },
  { title: "Pan's Labyrinth", year: 2006 },
  { title: 'Donnie Darko', year: 2001 },
  { title: 'Shutter Island', year: 2010 },
  { title: 'The Menu', year: 2022 },
  { title: 'Us', year: 2019 },
  { title: 'Get Out', year: 2017 },
  // Classics
  { title: 'Halloween', year: 1978 },
  { title: 'Psycho', year: 1960 },
  { title: 'The Shining', year: 1980 },
  { title: 'The Exorcist', year: 1973 },
  { title: 'The Thing', year: 1982 },
  { title: 'A Nightmare on Elm Street', year: 1984 },
  { title: 'Alien', year: 1979 },
  { title: 'The Birds', year: 1963 },
  { title: "Rosemary's Baby", year: 1968 },
  // Modern horror
  { title: 'It Follows', year: 2014 },
  { title: 'Hereditary', year: 2018 },
  { title: 'The Conjuring', year: 2013 },
  { title: 'A Quiet Place', year: 2018 },
  { title: 'Talk to Me', year: 2022 },
  { title: 'Train to Busan', year: 2016 },
  { title: 'Scary Stories to Tell in the Dark', year: 2019 },
  { title: 'Nosferatu', year: 2024 },
  { title: 'Frankenstein', year: 2025 },
  { title: 'Weapons', year: 2025 },
  { title: 'Sinners', year: 2025 },
];
