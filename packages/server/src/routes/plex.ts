import { Router } from 'express';
import { getLibraries } from '../plex';

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

export default router;
