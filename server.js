// Server for Word Chain Challenge
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Serve static files
app.use(express.static(path.join(__dirname, '/')));

// Game state
const rooms = new Map(); // roomCode -> room object
const players = new Map(); // socket.id -> player object

// Room class
class Room {
  constructor(code, hostId) {
    this.code = code;
    this.hostId = hostId;
    this.players = new Map(); // socket.id -> player
    this.wordChain = [];
    this.gameActive = false;
    this.currentPlayerIndex = 0;
    this.timer = null;
    this.timeLeft = 30;
    this.usedWords = new Set();
  }
  
  addPlayer(socketId, playerName) {
    const player = {
      id: socketId,
      name: playerName,
      score: 0,
      isCurrentPlayer: this.players.size === 0 // First player gets first turn
    };
    
    this.players.set(socketId, player);
    
    // If this is the first player, they're the current player
    if (this.players.size === 1) {
      player.isCurrentPlayer = true;
    }
    
    return player;
  }
  
  removePlayer(socketId) {
    const player = this.players.get(socketId);
    this.players.delete(socketId);
    
    // If the current player left, move to next player
    if (player && player.isCurrentPlayer && this.players.size > 0) {
      this.setNextPlayer();
    }
    
    return player;
  }
  
  setNextPlayer() {
    // Reset current player flag for all
    this.players.forEach(player => {
      player.isCurrentPlayer = false;
    });
    
    // Get player IDs as array
    const playerIds = Array.from(this.players.keys());
    
    // Move to next player
    this.currentPlayerIndex = (this.currentPlayerIndex + 1) % playerIds.length;
    const nextPlayerId = playerIds[this.currentPlayerIndex];
    const nextPlayer = this.players.get(nextPlayerId);
    
    if (nextPlayer) {
      nextPlayer.isCurrentPlayer = true;
    }
    
    return nextPlayer;
  }
  
  getCurrentPlayer() {
    const playerIds = Array.from(this.players.keys());
    if (playerIds.length === 0) return null;
    
    const currentPlayerId = playerIds[this.currentPlayerIndex];
    return this.players.get(currentPlayerId);
  }
  
  addWordToChain(word, playerId) {
    const player = this.players.get(playerId);
    if (!player) return null;
    
    // Check if word is valid (starts with last letter of previous word)
    if (this.wordChain.length > 0) {
      const lastWord = this.wordChain[this.wordChain.length - 1].word;
      const lastLetter = lastWord.charAt(lastWord.length - 1).toLowerCase();
      
      if (word.charAt(0).toLowerCase() !== lastLetter) {
        return { valid: false, reason: `Word must start with '${lastLetter.toUpperCase()}'` };
      }
    }
    
    // Check if word already used
    if (this.usedWords.has(word.toLowerCase())) {
      return { valid: false, reason: 'Word already used in this game' };
    }
    
    // Add to chain
    const chainEntry = {
      word: word,
      player: player.name,
      playerId: playerId,
      timestamp: Date.now()
    };
    
    this.wordChain.push(chainEntry);
    this.usedWords.add(word.toLowerCase());
    
    // Update player score
    player.score += word.length; // Longer words get more points
    
    return { valid: true, lastLetter: word.charAt(word.length - 1) };
  }
  
  getGameState() {
    const currentPlayer = this.getCurrentPlayer();
    
    return {
      gameActive: this.gameActive,
      currentPlayer: currentPlayer ? currentPlayer.name : 'None',
      currentPlayerId: currentPlayer ? currentPlayer.id : null,
      timeLeft: this.timeLeft
    };
  }
  
  getPlayersList() {
    return Array.from(this.players.values());
  }
  
  startGame() {
    this.gameActive = true;
    this.wordChain = [];
    this.usedWords.clear();
    this.currentPlayerIndex = 0;
    
    // Reset scores
    this.players.forEach(player => {
      player.score = 0;
      player.isCurrentPlayer = false;
    });
    
    // Set first player
    const playerIds = Array.from(this.players.keys());
    if (playerIds.length > 0) {
      const firstPlayer = this.players.get(playerIds[0]);
      firstPlayer.isCurrentPlayer = true;
    }
  }
  
  resetTimer() {
    if (this.timer) {
      clearInterval(this.timer);
    }
    
    this.timeLeft = 30;
    
    this.timer = setInterval(() => {
      this.timeLeft--;
      
      // Broadcast timer update
      io.to(this.code).emit('timer-update', { timeLeft: this.timeLeft });
      
      // If time runs out, skip to next player
      if (this.timeLeft <= 0) {
        const skippedPlayer = this.getCurrentPlayer();
        const nextPlayer = this.setNextPlayer();
        
        // Reset timer
        this.timeLeft = 30;
        
        // Notify players
        io.to(this.code).emit('turn-update', {
          currentPlayer: nextPlayer.name,
          currentPlayerId: nextPlayer.id,
          skippedPlayer: skippedPlayer.name
        });
        
        io.to(this.code).emit('chat-message', {
          sender: 'System',
          message: `${skippedPlayer.name} ran out of time! Turn passed to ${nextPlayer.name}.`,
          isSystem: true
        });
      }
    }, 1000);
  }
}

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);
  
  // Join room
  socket.on('join-room', (data) => {
    const { username, roomCode } = data;
    
    if (!username || !roomCode) {
      socket.emit('error', 'Username and room code are required');
      return;
    }
    
    // Create room if it doesn't exist
    if (!rooms.has(roomCode)) {
      const newRoom = new Room(roomCode, socket.id);
      rooms.set(roomCode, newRoom);
      console.log(`Room created: ${roomCode}`);
    }
    
    const room = rooms.get(roomCode);
    
    // Check if room is full (max 8 players)
    if (room.players.size >= 8) {
      socket.emit('error', 'Room is full (max 8 players)');
      return;
    }
    
    // Add player to room
    const player = room.addPlayer(socket.id, username);
    players.set(socket.id, { roomCode, playerName: username });
    
    // Join socket room
    socket.join(roomCode);
    
    // Send room data to joining player
    socket.emit('room-joined', {
      roomCode,
      players: room.getPlayersList(),
      wordChain: room.wordChain,
      gameState: room.getGameState()
    });
    
    // Notify other players in room
    socket.to(roomCode).emit('player-joined', {
      playerName: username,
      playerCount: room.players.size,
      players: room.getPlayersList()
    });
    
    console.log(`${username} joined room ${roomCode}`);
  });
  
  // Submit word
  socket.on('submit-word', (data) => {
    const { word } = data;
    const playerData = players.get(socket.id);
    
    if (!playerData) {
      socket.emit('error', 'You are not in a room');
      return;
    }
    
    const room = rooms.get(playerData.roomCode);
    if (!room) {
      socket.emit('error', 'Room not found');
      return;
    }
    
    // Check if it's player's turn
    const currentPlayer = room.getCurrentPlayer();
    if (!currentPlayer || currentPlayer.id !== socket.id) {
      socket.emit('error', "It's not your turn");
      return;
    }
    
    // Validate and add word
    const result = room.addWordToChain(word, socket.id);
    
    if (!result.valid) {
      socket.emit('error', result.reason);
      return;
    }
    
    // Move to next player
    const nextPlayer = room.setNextPlayer();
    
    // Reset timer
    room.resetTimer();
    
    // Broadcast word submission
    io.to(room.code).emit('word-submitted', {
      word: word,
      playerName: playerData.playerName,
      lastLetter: result.lastLetter,
      players: room.getPlayersList()
    });
    
    // Broadcast turn update
    io.to(room.code).emit('turn-update', {
      currentPlayer: nextPlayer.name,
      currentPlayerId: nextPlayer.id
    });
    
    // Send updated game state
    io.to(room.code).emit('game-state', room.getGameState());
  });
  
  // Chat message
  socket.on('chat-message', (data) => {
    const { message } = data;
    const playerData = players.get(socket.id);
    
    if (!playerData) {
      socket.emit('error', 'You are not in a room');
      return;
    }
    
    const room = rooms.get(playerData.roomCode);
    if (!room) {
      socket.emit('error', 'Room not found');
      return;
    }
    
    // Broadcast chat message to room
    io.to(room.code).emit('chat-message', {
      sender: playerData.playerName,
      message: message,
      isSystem: false
    });
  });
  
  // Start game
  socket.on('start-game', () => {
    const playerData = players.get(socket.id);
    
    if (!playerData) {
      socket.emit('error', 'You are not in a room');
      return;
    }
    
    const room = rooms.get(playerData.roomCode);
    if (!room) {
      socket.emit('error', 'Room not found');
      return;
    }
    
    // Check if player is host
    if (room.hostId !== socket.id) {
      socket.emit('error', 'Only the host can start the game');
      return;
    }
    
    // Start game
    room.startGame();
    room.resetTimer();
    
    // Notify all players
    io.to(room.code).emit('game-state', room.getGameState());
    io.to(room.code).emit('chat-message', {
      sender: 'System',
      message: 'Game started! First player: ' + room.getCurrentPlayer().name,
      isSystem: true
    });
  });
  
  // Leave room
  socket.on('leave-room', () => {
    const playerData = players.get(socket.id);
    
    if (!playerData) return;
    
    const room = rooms.get(playerData.roomCode);
    if (!room) return;
    
    // Remove player from room
    const player = room.removePlayer(socket.id);
    players.delete(socket.id);
    
    // Leave socket room
    socket.leave(room.code);
    
    // Notify other players
    socket.to(room.code).emit('player-left', {
      playerName: playerData.playerName,
      playerCount: room.players.size,
      players: room.getPlayersList()
    });
    
    // If room is empty, delete it
    if (room.players.size === 0) {
      if (room.timer) {
        clearInterval(room.timer);
      }
      rooms.delete(room.code);
      console.log(`Room deleted: ${room.code}`);
    } else {
      // If host left, assign new host
      if (room.hostId === socket.id) {
        const newHostId = Array.from(room.players.keys())[0];
        room.hostId = newHostId;
        
        // Notify new host
        io.to(newHostId).emit('chat-message', {
          sender: 'System',
          message: 'You are now the host of this room',
          isSystem: true
        });
      }
      
      // Send updated game state
      io.to(room.code).emit('game-state', room.getGameState());
    }
    
    console.log(`${playerData.playerName} left room ${room.code}`);
  });
  
  // Disconnect
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    
    const playerData = players.get(socket.id);
    if (!playerData) return;
    
    const room = rooms.get(playerData.roomCode);
    if (!room) return;
    
    // Remove player from room
    const player = room.removePlayer(socket.id);
    players.delete(socket.id);
    
    // Notify other players
    io.to(room.code).emit('player-left', {
      playerName: playerData.playerName,
      playerCount: room.players.size,
      players: room.getPlayersList()
    });
    
    // If room is empty, delete it
    if (room.players.size === 0) {
      if (room.timer) {
        clearInterval(room.timer);
      }
      rooms.delete(room.code);
      console.log(`Room deleted: ${room.code}`);
    } else {
      // If host disconnected, assign new host
      if (room.hostId === socket.id) {
        const newHostId = Array.from(room.players.keys())[0];
        room.hostId = newHostId;
        
        // Notify new host
        io.to(newHostId).emit('chat-message', {
          sender: 'System',
          message: 'You are now the host of this room',
          isSystem: true
        });
      }
      
      // Send updated game state
      io.to(room.code).emit('game-state', room.getGameState());
    }
  });
});

// Serve main page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});