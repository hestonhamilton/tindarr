import { Router } from 'express';
import { getNewPin, getAuthToken } from '../plex';

const router = Router();

router.post('/plex/pin', async (req, res) => {
  try {
    const pin = await getNewPin();
    res.json(pin);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to get a new Plex pin.' });
  }
});

router.get('/plex/token/:pinId', async (req, res) => {
  try {
    const { pinId } = req.params;
    const authToken = await getAuthToken(parseInt(pinId, 10));
    if (authToken) {
      res.json({ authToken });
    } else {
      res.status(404).json({ error: 'Auth token not found.' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to get Plex auth token.' });
  }
});

export default router;
