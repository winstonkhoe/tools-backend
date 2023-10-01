import { createServer } from 'http';
import { Server } from 'socket.io';
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { log } from './utils/logging.js';
import { fillLogBook } from './utils/automations/logbook.js';
import { SOCKET_EVENT } from './utils/constants.js';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CORS_ORIGIN
  }
});

const port = process.env.PORT || 8000;

const corsOptions = {
  origin: process.env.CORS_ORIGIN, //replace this with your frontend domain
  optionsSuccessStatus: 200
};

const initializeApp = async () => {
  app.use(cors(corsOptions));
  app.use(express.static('public'));
};

await initializeApp();

io.on('connection', (socket) => {
  console.log(`socket ${socket.id} connected`);

  socket.on(
    SOCKET_EVENT.enrichmentAutomation.fillLogBook.trigger,
    async (email, password, file, months) => {
      fillLogBook({
        socket: socket,
        email: email,
        password: password,
        fileBuffer: file,
        months: months
      });
    }
  );

  socket.on('disconnect', () => {
    console.log(`socket ${socket.id} disconnected`);
  });
});

httpServer.listen(port, () => {
  log(`listening on port ${port}`);
});
