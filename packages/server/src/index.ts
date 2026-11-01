import express from 'express';
import http from 'http';
import path from 'path';
import cors from 'cors'; // Import cors
import authRouter from './routes/auth';
import plexRouter from './routes/plex';
import { createRoomsRouter } from './routes/rooms';
import { RoomManager } from './room';
import { createSocketServer } from './socket';

const app = express();
const server = http.createServer(app);
const port = process.env.PORT || 3001;

app.use(cors()); // Use cors middleware

const roomManager = new RoomManager();
createSocketServer(server, roomManager);

app.use('/api/auth', authRouter);
app.use('/api/plex', plexRouter);
app.use('/api/rooms', express.json(), createRoomsRouter(roomManager));

// Serve the built client (present in the production image) with an SPA fallback
// so deep links like /room/ABC123 and /auth/callback load the app.
const clientDist = path.join(__dirname, '../../client/dist');
app.use(express.static(clientDist));
app.get('/{*splat}', (req, res) => {
  res.sendFile(path.join(clientDist, 'index.html'));
});

server.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
