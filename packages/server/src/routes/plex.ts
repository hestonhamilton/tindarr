import { Router } from 'express';
import { getLibraries, getMoviesCount, getMovies, getGenres, getLibraryYearRange } from '../plex'; // Import getLibraryYearRange
import { Movie, SelectedLibrary } from '../types'; // Import SelectedLibrary

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

// ... (existing /libraries, /movies/count, /movies, /genres routes)

router.get('/years/range', async (req, res) => {
  try {
    const { plexUrl, plexToken, selectedLibraries } = req.query;

    if (!plexUrl || !plexToken || !selectedLibraries) {
      return res.status(400).json({ error: 'Plex URL, token, and selectedLibraries are required.' });
    }

    let parsedSelectedLibraries: SelectedLibrary[];
    try {
      parsedSelectedLibraries = JSON.parse(selectedLibraries as string);
      if (!Array.isArray(parsedSelectedLibraries) || parsedSelectedLibraries.length === 0) {
        return res.status(400).json({ error: 'Invalid or empty selectedLibraries parameter.' });
      }
    } catch (parseError) {
      return res.status(400).json({ error: 'Invalid JSON for selectedLibraries parameter.' });
    }

    let overallMinYear: number | undefined;
    let overallMaxYear: number | undefined;

    for (const lib of parsedSelectedLibraries) {
      const yearRange = await getLibraryYearRange(
        plexUrl as string,
        plexToken as string,
        lib.key,
        lib.type
      );

      if (yearRange) {
        if (overallMinYear === undefined || yearRange.minYear < overallMinYear) {
          overallMinYear = yearRange.minYear;
        }
        if (overallMaxYear === undefined || yearRange.maxYear > overallMaxYear) {
          overallMaxYear = yearRange.maxYear;
        }
      }
    }

    if (overallMinYear !== undefined && overallMaxYear !== undefined) {
      console.log(`[Server] Overall year range: ${overallMinYear}-${overallMaxYear}`);
      res.json({ minYear: overallMinYear, maxYear: overallMaxYear });
    } else {
      console.log('[Server] No overall year range could be determined.');
      res.json({ minYear: null, maxYear: null }); // No years found
    }
  } catch (error) {
    console.error(`[Server] Failed to get year range: ${error}`);
    res.status(500).json({ error: 'Failed to get year range.' });
  }
});

router.get('/movies/count', async (req, res) => {
  try {
    const { plexUrl, plexToken, selectedLibraries, genre, yearMin, yearMax, contentRating } = req.query;

    console.log(`[Server] Received request for /movies/count with:`); // Added log
    console.log(`[Server]   plexUrl: ${plexUrl}`); // Added log
    console.log(`[Server]   plexToken: ${plexToken ? '[REDACTED]' : 'N/A'}`); // Added log
    console.log(`[Server]   selectedLibraries: ${selectedLibraries}`); // Added log
    console.log(`[Server]   genre: ${genre}`); // Added log
    console.log(`[Server]   yearMin: ${yearMin}`); // Added log
    console.log(`[Server]   yearMax: ${yearMax}`); // Added log
    console.log(`[Server]   contentRating: ${contentRating}`); // Added log


    if (!plexUrl || !plexToken || !selectedLibraries) {
      console.error('[Server] Missing required parameters for /movies/count'); // Added log
      return res.status(400).json({ error: 'Plex URL, token, and selectedLibraries are required.' });
    }

    let parsedSelectedLibraries: SelectedLibrary[];
    try {
      parsedSelectedLibraries = JSON.parse(selectedLibraries as string);
      console.log(`[Server] Parsed selectedLibraries: ${JSON.stringify(parsedSelectedLibraries)}`); // Added log
      if (!Array.isArray(parsedSelectedLibraries) || parsedSelectedLibraries.length === 0) {
        console.error('[Server] Invalid or empty selectedLibraries array after parsing.'); // Added log
        return res.status(400).json({ error: 'Invalid or empty selectedLibraries parameter.' });
      }
    } catch (parseError) {
      console.error(`[Server] Failed to parse selectedLibraries JSON: ${parseError}`); // Added log
      return res.status(400).json({ error: 'Invalid JSON for selectedLibraries parameter.' });
    }

    let totalCount = 0;
    for (const lib of parsedSelectedLibraries) {
      console.log(`[Server] Calling getMoviesCount for library ${lib.key} (type: ${lib.type})`); // Added log
      const count = await getMoviesCount(
        plexUrl as string,
        plexToken as string,
        lib.key,
        lib.type,
        genre as string,
        yearMin ? parseInt(yearMin as string, 10) : undefined,
        yearMax ? parseInt(yearMax as string, 10) : undefined,
        contentRating as string
      );
      totalCount += count;
      console.log(`[Server] Count for library ${lib.key}: ${count}. Current total: ${totalCount}`); // Added log
    }

    console.log(`[Server] Final total movie count: ${totalCount}`); // Added log
    res.json({ count: totalCount });
  } catch (error) {
    console.error(`[Server] Failed to get movies count: ${error}`); // Added log
    res.status(500).json({ error: 'Failed to get movies count.' });
  }
});

router.get('/movies', async (req, res) => {
  try {
    const { plexUrl, plexToken, selectedLibraries, genre, yearMin, yearMax, contentRating } = req.query;

    if (!plexUrl || !plexToken || !selectedLibraries) {
      return res.status(400).json({ error: 'Plex URL, token, and selectedLibraries are required.' });
    }

    let parsedSelectedLibraries: SelectedLibrary[];
    try {
      parsedSelectedLibraries = JSON.parse(selectedLibraries as string);
      if (!Array.isArray(parsedSelectedLibraries) || parsedSelectedLibraries.length === 0) {
        return res.status(400).json({ error: 'Invalid or empty selectedLibraries parameter.' });
      }
    } catch (parseError) {
      return res.status(400).json({ error: 'Invalid JSON for selectedLibraries parameter.' });
    }

    const allMovies: Movie[] = [];
    for (const lib of parsedSelectedLibraries) {
      const movies = await getMovies(
        plexUrl as string,
        plexToken as string,
        lib.key, // Pass individual library key
        lib.type, // Pass library type
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

router.get('/genres', async (req, res) => {
  try {
    const { plexUrl, plexToken, libraryKeys } = req.query;

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

    const genres = await getGenres(
      plexUrl as string,
      plexToken as string,
      libraryKeysArray
    );
    res.json(genres);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to get genres.' });
  }
});

export default router;
