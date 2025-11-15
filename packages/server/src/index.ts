import express from 'express';
import http from 'http';
import cors from 'cors'; // Import cors
import authRouter from './routes/auth';
import plexRouter from './routes/plex';
import { createSocketServer } from './socket';

const app = express();
const server = http.createServer(app);
const port = process.env.PORT || 3001;

app.use(cors()); // Use cors middleware

createSocketServer(server);

app.use('/api/auth', authRouter);
app.use('/api/plex', plexRouter);

app.get('/', (req, res) => {
  res.send('Hello from the Tindarr server!');
});

server.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
