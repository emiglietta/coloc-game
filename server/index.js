import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { applyAction } from './gameState.js';

const app = express();
app.use(cors());
app.use(express.json());

const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: { origin: '*' }
});

let state = {
  sessions: {},
  teams: {}
};

function broadcastState() {
  io.emit('state', { sessions: state.sessions, teams: state.teams });
}

io.on('connection', (socket) => {
  socket.emit('state', { sessions: state.sessions, teams: state.teams });

  socket.on('action', (msg, ackCb) => {
    const { type, payload } = msg || {};
    if (!type) {
      if (typeof ackCb === 'function') ackCb({ error: 'Missing action type' });
      return;
    }
    const result = applyAction(state, type, payload || {});
    if (result.state) {
      state = result.state;
      broadcastState();
    }
    if (typeof ackCb === 'function') {
      ackCb(result.ack || {});
    }
  });
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`coloc-game server on http://localhost:${PORT}`);
});
