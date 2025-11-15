import { Router } from 'express';
import { getLibraries, getMoviesCount, getMovies } from '../plex';
import { Movie } from '../types'; // Import Movie type

const router = Router();

router.get('/libraries', async (req, res) => {
  try {
    const { plexUrl, plexToken } = req.query;

    if (!plexUrl || !plexToken) {
      return res.status(400).json({ error: 'Plex URL and token are required.' });
    }

    const libraries = await getLibraries(plexUrl as string, plexToken as string);
    res.json(libraries);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to get Plex libraries.' });
  }
});

router.get('/movies/count', async (req, res) => {
  try {
    const { plexUrl, plexToken, libraryKeys, genre, yearMin, yearMax, contentRating } = req.query;

    if (!plexUrl || !plexToken || !libraryKeys) {
      return res.status(400).json({ error: 'Plex URL, token, and library keys are required.' });
    }

    // Ensure libraryKeys is an array
    let libraryKeysArray: string[] = [];
    if (typeof libraryKeys === 'string') {
      libraryKeysArray = libraryKeys.split(',');
    } else if (Array.isArray(libraryKeys)) {
      libraryKeysArray = libraryKeys as string[];
    } else {
      return res.status(400).json({ error: 'Invalid libraryKeys parameter.' });
    }

    if (libraryKeysArray.length === 0 || (libraryKeysArray.length === 1 && libraryKeysArray[0] === '')) {
      return res.status(400).json({ error: 'At least one library key is required.' });
    }

    const count = await getMoviesCount(
      plexUrl as string,
      plexToken as string,
      libraryKeysArray,
      genre as string,
      yearMin ? parseInt(yearMin as string, 10) : undefined,
      yearMax ? parseInt(yearMax as string, 10) : undefined,
      contentRating as string
    );
    res.json({ count });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to get movies count.' });
  }
});

router.get('/movies', async (req, res) => {
  try {
    const { plexUrl, plexToken, libraryKeys, genre, yearMin, yearMax, contentRating } = req.query;

    if (!plexUrl || !plexToken || !libraryKeys) {
      return res.status(400).json({ error: 'Plex URL, token, and library keys are required.' });
    }

    // Ensure libraryKeys is an array
    const libraryKeysArray = Array.isArray(libraryKeys) ? libraryKeys : [libraryKeys];

    if (libraryKeysArray.length === 0 || (libraryKeysArray.length === 1 && libraryKeysArray[0] === '')) {
      return res.status(400).json({ error: 'At least one library key is required.' });
    }

    const allMovies: Movie[] = [];
    for (const key of libraryKeysArray) {
      const movies = await getMovies(
        plexUrl as string,
        plexToken as string,
        key as string, // Pass individual library key
        genre as string | undefined,
        yearMin ? parseInt(yearMin as string, 10) : undefined,
        yearMax ? parseInt(yearMax as string, 10) : undefined,
        contentRating as string | undefined
      );
      allMovies.push(...movies);
    }

    res.json(allMovies);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to get movies.' });
  }
});

export default router;
