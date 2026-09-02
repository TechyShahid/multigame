/**
 * PvP Online 1v1 Real-Time Race (WebRTC via PeerJS)
 * Zero backend required; direct browser-to-browser DataChannel
 */

export class PvPOnlineRace {
  constructor(app, options = {}) {
    this.app = app;
    this.peer = null;
    this.connection = null;
    this.isHost = false;
    this.roomCode = null;
    this.isConnected = false;
    this.isActive = false;

    this.myProgress = 0;
    this.opponentProgress = 0;
    this.opponentMistakes = 0;

    this.onConnected = options.onConnected || (() => {});
    this.onOpponentProgress = options.onOpponentProgress || (() => {});
    this.onOpponentWon = options.onOpponentWon || (() => {});
    this.onError = options.onError || (() => {});
    this.onStatusChange = options.onStatusChange || (() => {});
  }

  generateRoomCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 5; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  ensurePeerJS() {
    return new Promise((resolve, reject) => {
      if (window.Peer) {
        resolve(window.Peer);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/peerjs@1.5.4/dist/peerjs.min.js';
      script.onload = () => resolve(window.Peer);
      script.onerror = () => reject(new Error('Failed to load PeerJS library'));
      document.head.appendChild(script);
    });
  }

  async createRoom(difficulty = 'medium') {
    await this.ensurePeerJS();
    this.isHost = true;
    this.roomCode = this.generateRoomCode();
    const peerId = `zensudoku-${this.roomCode}`;

    this.cleanup();
    this.onStatusChange('Connecting to multiplayer network...');

    try {
      this.peer = new window.Peer(peerId);

      this.peer.on('open', (id) => {
        this.onStatusChange(`Room ${this.roomCode} ready! Waiting for opponent to join...`);
      });

      this.peer.on('connection', (conn) => {
        this.setupConnection(conn, difficulty);
      });

      this.peer.on('error', (err) => {
        console.error('Peer error:', err);
        if (err.type === 'unavailable-id') {
          // Retry with new code if collision
          this.createRoom(difficulty);
        } else {
          this.onError(err.message || 'Connection error');
        }
      });
    } catch (e) {
      this.onError(e.message);
    }

    return this.roomCode;
  }

  async joinRoom(code) {
    await this.ensurePeerJS();
    this.isHost = false;
    this.roomCode = code.trim().toUpperCase();
    const targetPeerId = `zensudoku-${this.roomCode}`;

    this.cleanup();
    this.onStatusChange(`Joining Room ${this.roomCode}...`);

    try {
      this.peer = new window.Peer();

      this.peer.on('open', () => {
        const conn = this.peer.connect(targetPeerId, { reliable: true });
        this.setupConnection(conn);
      });

      this.peer.on('error', (err) => {
        console.error('Peer join error:', err);
        this.onError(`Could not join room ${this.roomCode}. Please check code and try again.`);
      });
    } catch (e) {
      this.onError(e.message);
    }
  }

  setupConnection(conn, difficulty = 'medium') {
    this.connection = conn;

    conn.on('open', () => {
      this.isConnected = true;
      this.isActive = true;
      this.onStatusChange('Connected! Preparing match...');
      this.onConnected({ isHost: this.isHost, roomCode: this.roomCode });

      if (this.isHost) {
        // Host generates puzzle and sends to guest
        const puzzle = this.app.getEngine().generate(difficulty);
        conn.send({
          type: 'START_GAME',
          puzzle: {
            initial: puzzle.initial,
            solution: puzzle.solution,
            difficulty: difficulty
          }
        });
        this.app.startMultiplayerPuzzle(puzzle);
      }
    });

    conn.on('data', (data) => {
      this.handleIncomingData(data);
    });

    conn.on('close', () => {
      this.isConnected = false;
      this.isActive = false;
      this.app.showToast('⚠️ Opponent disconnected from match.');
      this.onStatusChange('Opponent disconnected.');
    });

    conn.on('error', (err) => {
      console.error('Connection data error:', err);
    });
  }

  handleIncomingData(data) {
    if (!data || !data.type) return;

    if (data.type === 'START_GAME' && !this.isHost) {
      this.app.startMultiplayerPuzzle(data.puzzle);
    } else if (data.type === 'PROGRESS') {
      this.opponentProgress = data.percent;
      this.opponentMistakes = data.mistakes;
      this.onOpponentProgress({
        percent: data.percent,
        mistakes: data.mistakes,
        filled: data.filled,
        total: data.total
      });
    } else if (data.type === 'WIN') {
      this.onOpponentWon(data);
    } else if (data.type === 'REMATCH_REQ') {
      this.app.showToast('Opponent requested a rematch!');
      if (confirm('Opponent wants a rematch! Accept?')) {
        this.sendRematchAccept();
      }
    } else if (data.type === 'REMATCH_ACCEPT') {
      if (this.isHost) {
        const puzzle = this.app.getEngine().generate(this.app.difficulty);
        this.connection.send({
          type: 'START_GAME',
          puzzle: {
            initial: puzzle.initial,
            solution: puzzle.solution,
            difficulty: this.app.difficulty
          }
        });
        this.app.startMultiplayerPuzzle(puzzle);
      }
    }
  }

  broadcastProgress(filled, total, mistakes) {
    if (!this.connection || !this.isConnected) return;
    const percent = Math.min(100, Math.round((filled / total) * 100));
    this.myProgress = percent;

    this.connection.send({
      type: 'PROGRESS',
      percent,
      filled,
      total,
      mistakes
    });
  }

  broadcastWin(timeSeconds, score) {
    if (!this.connection || !this.isConnected) return;
    this.connection.send({
      type: 'WIN',
      timeSeconds,
      score
    });
  }

  sendRematchRequest() {
    if (this.connection && this.isConnected) {
      this.connection.send({ type: 'REMATCH_REQ' });
    }
  }

  sendRematchAccept() {
    if (this.connection && this.isConnected) {
      this.connection.send({ type: 'REMATCH_ACCEPT' });
      if (this.isHost) {
        const puzzle = this.app.getEngine().generate(this.app.difficulty);
        this.connection.send({
          type: 'START_GAME',
          puzzle: {
            initial: puzzle.initial,
            solution: puzzle.solution,
            difficulty: this.app.difficulty
          }
        });
        this.app.startMultiplayerPuzzle(puzzle);
      }
    }
  }

  cleanup() {
    if (this.connection) {
      try { this.connection.close(); } catch (e) {}
      this.connection = null;
    }
    if (this.peer) {
      try { this.peer.destroy(); } catch (e) {}
      this.peer = null;
    }
    this.isConnected = false;
    this.isActive = false;
  }
}
