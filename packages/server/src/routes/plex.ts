import { Router } from 'express';
import { getLibraries, getMoviesCount, getMovies } from '../plex';

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

    const count = await getMoviesCount(
      plexUrl as string,
      plexToken as string,
      libraryKeys as string[],
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
    const { plexUrl, plexToken, libraryKey, genre, yearMin, yearMax, contentRating } = req.query;

    if (!plexUrl || !plexToken || !libraryKey) {
      return res.status(400).json({ error: 'Plex URL, token, and library key are required.' });
    }

    const movies = await getMovies(
      plexUrl as string,
      plexToken as string,
      libraryKey as string,
      genre as string,
      yearMin ? parseInt(yearMin as string, 10) : undefined,
      yearMax ? parseInt(yearMax as string, 10) : undefined,
      contentRating as string
    );
    res.json(movies);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to get movies.' });
  }
});

export default router;
