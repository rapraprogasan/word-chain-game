// Enhanced server for both Word Chain and Emoji Match games
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

// Emoji puzzles database
const emojiPuzzles = [
  // Movies
  { emojis: ['🎬', '🍿', '🌟'], answer: 'movie night', category: 'Movies', hints: ['Entertainment', 'Cinema'] },
  { emojis: ['👽', '🛸', '🌍'], answer: 'alien invasion', category: 'Movies', hints: ['Sci-fi', 'Space'] },
  { emojis: ['🦁', '👑', '🌅'], answer: 'lion king', category: 'Movies', hints: ['Disney', 'Animation'] },
  { emojis: ['⚡', '👦', '🧙'], answer: 'harry potter', category: 'Movies', hints: ['Magic', 'Wizard'] },
  { emojis: ['🦈', '🏊', '🌊'], answer: 'jaws', category: 'Movies', hints: ['Shark', 'Beach'] },
  
  // Phrases
  { emojis: ['🐝', '💃'], answer: 'busy bee', category: 'Phrases', hints: ['Hardworking', 'Insect'] },
  { emojis: ['🐈', '📦'], answer: 'cat in a box', category: 'Phrases', hints: ['Curious', 'Container'] },
  { emojis: ['🍎', '👨', '👩'], answer: 'apple of my eye', category: 'Phrases', hints: ['Favorite', 'Expression'] },
  { emojis: ['⏰', '💣'], answer: 'time bomb', category: 'Phrases', hints: ['Danger', 'Clock'] },
  { emojis: ['🌧️', '🐱', '🐶'], answer: 'raining cats and dogs', category: 'Phrases', hints: ['Weather', 'Animals'] },
  
  // Songs
  { emojis: ['🎵', '🌍', '👥'], answer: 'we are the world', category: 'Songs', hints: ['Charity', 'Together'] },
  { emojis: ['⬆️', '⬇️', '👆'], answer: 'uptown funk', category: 'Songs', hints: ['Bruno Mars', 'Dance'] },
  { emojis: ['💃', '💎'], answer: 'diamonds are forever', category: 'Songs', hints: ['James Bond', 'Shiny'] },
  { emojis: ['👶', '🦈'], answer: 'baby shark', category: 'Songs', hints: ['Children', 'Sea'] },
  { emojis: ['🎶', '🌙'], answer: 'fly me to the moon', category: 'Songs', hints: ['Frank Sinatra', 'Space'] },
  
  // Food
  { emojis: ['🍕', '👑'], answer: 'pizza king', category: 'Food', hints: ['Italian', 'Royal'] },
  { emojis: ['☕', '📚'], answer: 'coffee break', category: 'Food', hints: ['Drink', 'Rest'] },
  { emojis: ['🍦', '😊'], answer: 'ice cream smile', category: 'Food', hints: ['Dessert', 'Happy'] },
  { emojis: ['🍔', '👑'], answer: 'burger king', category: 'Food', hints: ['Fast food', 'Royal'] },
  { emojis: ['🥓', '🍳'], answer: 'bacon and eggs', category: 'Food', hints: ['Breakfast', 'Protein'] }
];

// Room class for Word Chain
class WordChainRoom {
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
    this.gameType = 'word-chain';
  }
  
  addPlayer(socketId, playerName) {
    const player = {
      id: socketId,
      name: playerName,
      score: 0,
      isCurrentPlayer: this.players.size === 0
    };
    
    this.players.set(socketId, player);
    
    if (this.players.size === 1) {
      player.isCurrentPlayer = true;
    }
    
    return player;
  }
  
  removePlayer(socketId) {
    const player = this.players.get(socketId);
    this.players.delete(socketId);
    
    if (player && player.isCurrentPlayer && this.players.size > 0) {
      this.setNextPlayer();
    }
    
    return player;
  }
  
  setNextPlayer() {
    this.players.forEach(player => {
      player.isCurrentPlayer = false;
    });
    
    const playerIds = Array.from(this.players.keys());
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
    
    if (this.wordChain.length > 0) {
      const lastWord = this.wordChain[this.wordChain.length - 1].word;
      const lastLetter = lastWord.charAt(lastWord.length - 1).toLowerCase();
      
      if (word.charAt(0).toLowerCase() !== lastLetter) {
        return { valid: false, reason: `Word must start with '${lastLetter.toUpperCase()}'` };
      }
    }
    
    if (this.usedWords.has(word.toLowerCase())) {
      return { valid: false, reason: 'Word already used in this game' };
    }
    
    const chainEntry = {
      word: word,
      player: player.name,
      playerId: playerId,
      timestamp: Date.now()
    };
    
    this.wordChain.push(chainEntry);
    this.usedWords.add(word.toLowerCase());
    player.score += word.length;
    
    return { valid: true, lastLetter: word.charAt(word.length - 1) };
  }
  
  getGameState() {
    const currentPlayer = this.getCurrentPlayer();
    
    return {
      gameActive: this.gameActive,
      currentPlayer: currentPlayer ? currentPlayer.name : 'None',
      currentPlayerId: currentPlayer ? currentPlayer.id : null,
      timeLeft: this.timeLeft,
      gameType: this.gameType
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
    
    this.players.forEach(player => {
      player.score = 0;
      player.isCurrentPlayer = false;
    });
    
    const playerIds = Array.from(this.players.keys());
    if (playerIds.length > 0) {
      const firstPlayer = this.players.get(playerIds[0]);
      firstPlayer.isCurrentPlayer = true;
    }
    
    this.resetTimer();
  }
  
  resetTimer() {
    if (this.timer) {
      clearInterval(this.timer);
    }
    
    this.timeLeft = 30;
    
    this.timer = setInterval(() => {
      this.timeLeft--;
      
      io.to(this.code).emit('wordchain-timer-update', { timeLeft: this.timeLeft });
      
      if (this.timeLeft <= 0) {
        const skippedPlayer = this.getCurrentPlayer();
        const nextPlayer = this.setNextPlayer();
        
        this.timeLeft = 30;
        
        io.to(this.code).emit('wordchain-turn-update', {
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
  
  stopTimer() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }
}

// Room class for Emoji Match
class EmojiMatchRoom {
  constructor(code, hostId) {
    this.code = code;
    this.hostId = hostId;
    this.players = new Map(); // socket.id -> player
    this.gameActive = false;
    this.currentPlayerIndex = 0;
    this.timer = null;
    this.timeLeft = 60;
    this.currentPuzzle = null;
    this.guesses = [];
    this.currentRound = 1;
    this.totalRounds = 5;
    this.usedPuzzles = new Set();
    this.gameType = 'emoji-match';
  }
  
  addPlayer(socketId, playerName) {
    const player = {
      id: socketId,
      name: playerName,
      score: 0,
      isCurrentPlayer: this.players.size === 0
    };
    
    this.players.set(socketId, player);
    
    if (this.players.size === 1) {
      player.isCurrentPlayer = true;
    }
    
    return player;
  }
  
  removePlayer(socketId) {
    const player = this.players.get(socketId);
    this.players.delete(socketId);
    
    if (player && player.isCurrentPlayer && this.players.size > 0) {
      this.setNextPlayer();
    }
    
    return player;
  }
  
  setNextPlayer() {
    this.players.forEach(player => {
      player.isCurrentPlayer = false;
    });
    
    const playerIds = Array.from(this.players.keys());
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
  
  getRandomPuzzle() {
    // Filter out used puzzles
    const availablePuzzles = emojiPuzzles.filter(puzzle => 
      !this.usedPuzzles.has(puzzle.answer)
    );
    
    if (availablePuzzles.length === 0) {
      // Reset used puzzles if all have been used
      this.usedPuzzles.clear();
      return emojiPuzzles[Math.floor(Math.random() * emojiPuzzles.length)];
    }
    
    const randomPuzzle = availablePuzzles[Math.floor(Math.random() * availablePuzzles.length)];
    this.usedPuzzles.add(randomPuzzle.answer);
    
    return randomPuzzle;
  }
  
  submitGuess(guess, playerId) {
    const player = this.players.get(playerId);
    if (!player) return null;
    
    const normalizedGuess = guess.trim().toLowerCase();
    const normalizedAnswer = this.currentPuzzle.answer.toLowerCase();
    
    const isCorrect = normalizedGuess === normalizedAnswer;
    
    const guessEntry = {
      guess: guess,
      playerName: player.name,
      playerId: playerId,
      isCorrect: isCorrect,
      timestamp: Date.now()
    };
    
    this.guesses.push(guessEntry);
    
    if (isCorrect) {
      // Award points based on how fast they answered
      const points = Math.max(10, Math.floor(this.timeLeft / 6));
      player.score += points;
      
      // Move to next round or end game
      if (this.currentRound >= this.totalRounds) {
        this.endGame();
      } else {
        this.currentRound++;
        this.nextRound();
      }
    }
    
    return { isCorrect, points: isCorrect ? points : 0 };
  }
  
  nextRound() {
    // Clear guesses
    this.guesses = [];
    
    // Get new puzzle
    this.currentPuzzle = this.getRandomPuzzle();
    
    // Reset timer
    this.resetTimer();
    
    // Set next player
    const nextPlayer = this.setNextPlayer();
    
    // Broadcast new round
    io.to(this.code).emit('emojimatch-round-update', {
      currentRound: this.currentRound,
      totalRounds: this.totalRounds
    });
    
    io.to(this.code).emit('emojimatch-puzzle-update', this.currentPuzzle);
    
    io.to(this.code).emit('emojimatch-turn-update', {
      currentPlayer: nextPlayer.name,
      currentPlayerId: nextPlayer.id
    });
    
    io.to(this.code).emit('chat-message', {
      sender: 'System',
      message: `Round ${this.currentRound}! New emoji puzzle: ${this.currentPuzzle.emojis.join(' ')}`,
      isSystem: true
    });
  }
  
  endGame() {
    this.gameActive = false;
    this.stopTimer();
    
    // Find winner
    let winner = null;
    let highestScore = -1;
    
    this.players.forEach(player => {
      if (player.score > highestScore) {
        highestScore = player.score;
        winner = player.name;
      }
    });
    
    io.to(this.code).emit('game-over', {
      winner: winner,
      winningScore: highestScore,
      gameType: this.gameType
    });
  }
  
  getGameState() {
    const currentPlayer = this.getCurrentPlayer();
    
    return {
      gameActive: this.gameActive,
      currentPlayer: currentPlayer ? currentPlayer.name : 'None',
      currentPlayerId: currentPlayer ? currentPlayer.id : null,
      timeLeft: this.timeLeft,
      currentRound: this.currentRound,
      totalRounds: this.totalRounds,
      gameType: this.gameType
    };
  }
  
  getPlayersList() {
    return Array.from(this.players.values());
  }
  
  startGame() {
    this.gameActive = true;
    this.currentRound = 1;
    this.usedPuzzles.clear();
    this.guesses = [];
    this.currentPlayerIndex = 0;
    
    this.players.forEach(player => {
      player.score = 0;
      player.isCurrentPlayer = false;
    });
    
    const playerIds = Array.from(this.players.keys());
    if (playerIds.length > 0) {
      const firstPlayer = this.players.get(playerIds[0]);
      firstPlayer.isCurrentPlayer = true;
    }
    
    // Get first puzzle
    this.currentPuzzle = this.getRandomPuzzle();
    this.resetTimer();
  }
  
  resetTimer() {
    if (this.timer) {
      clearInterval(this.timer);
    }
    
    this.timeLeft = 60;
    
    this.timer = setInterval(() => {
      this.timeLeft--;
      
      io.to(this.code).emit('emojimatch-timer-update', { timeLeft: this.timeLeft });
      
      if (this.timeLeft <= 0) {
        const skippedPlayer = this.getCurrentPlayer();
        const nextPlayer = this.setNextPlayer();
        
        this.timeLeft = 60;
        
        io.to(this.code).emit('emojimatch-turn-update', {
          currentPlayer: nextPlayer.name,
          currentPlayerId: nextPlayer.id,
          skippedPlayer: skippedPlayer.name
        });
        
        io.to(this.code).emit('chat-message', {
          sender: 'System',
          message: `${skippedPlayer.name} ran out of time! New puzzle for ${nextPlayer.name}.`,
          isSystem: true
        });
        
        // Get new puzzle
        this.currentPuzzle = this.getRandomPuzzle();
        io.to(this.code).emit('emojimatch-puzzle-update', this.currentPuzzle);
      }
    }, 1000);
  }
  
  stopTimer() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }
}

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);
  
  // Join room
  socket.on('join-room', (data) => {
    const { username, roomCode, gameType } = data;
    
    if (!username || !roomCode || !gameType) {
      socket.emit('error', 'Username, room code and game type are required');
      return;
    }
    
    // Check if room exists with different game type
    if (rooms.has(roomCode) && rooms.get(roomCode).gameType !== gameType) {
      socket.emit('error', `This room is currently playing ${rooms.get(roomCode).gameType === 'word-chain' ? 'Word Chain' : 'Emoji Match'}. Please create a new room or switch game type.`);
      return;
    }
    
    // Create room if it doesn't exist
    if (!rooms.has(roomCode)) {
      let newRoom;
      if (gameType === 'word-chain') {
        newRoom = new WordChainRoom(roomCode, socket.id);
      } else {
        newRoom = new EmojiMatchRoom(roomCode, socket.id);
      }
      rooms.set(roomCode, newRoom);
      console.log(`Room created: ${roomCode} for ${gameType}`);
    }
    
    const room = rooms.get(roomCode);
    
    // Check if room is full
    if (room.players.size >= 8) {
      socket.emit('error', 'Room is full (max 8 players)');
      return;
    }
    
    // Add player to room
    const player = room.addPlayer(socket.id, username);
    players.set(socket.id, { roomCode, playerName: username, gameType });
    
    // Join socket room
    socket.join(roomCode);
    
    // Prepare response data
    const responseData = {
      roomCode,
      players: room.getPlayersList(),
      gameType: room.gameType,
      gameState: room.getGameState()
    };
    
    // Add game-specific data
    if (room.gameType === 'word-chain') {
      responseData.wordChain = room.wordChain;
    } else if (room.gameType === 'emoji-match') {
      responseData.currentPuzzle = room.currentPuzzle;
      responseData.guesses = room.guesses;
    }
    
    // Send room data to joining player
    socket.emit('room-joined', responseData);
    
    // Send host status
    socket.emit('host-status', {
      isHost: room.hostId === socket.id,
      players: room.getPlayersList()
    });
    
    // Notify other players in room
    socket.to(roomCode).emit('player-joined', {
      playerName: username,
      playerCount: room.players.size,
      players: room.getPlayersList()
    });
    
    // Update game state for all players
    if (room.gameType === 'word-chain') {
      io.to(roomCode).emit('wordchain-game-state', room.getGameState());
    } else {
      io.to(roomCode).emit('emojimatch-game-state', room.getGameState());
    }
    
    console.log(`${username} joined ${gameType} room ${roomCode}`);
  });
  
  // Switch game type
  socket.on('switch-game', (data) => {
    const { gameType } = data;
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
      socket.emit('error', 'Only the host can switch games');
      return;
    }
    
    // Don't switch if game is active
    if (room.gameActive) {
      socket.emit('error', 'Cannot switch games while game is active');
      return;
    }
    
    // Create new room with different game type
    const oldRoomCode = room.code;
    const playersList = room.getPlayersList();
    
    // Remove old room
    rooms.delete(oldRoomCode);
    
    // Create new room
    let newRoom;
    if (gameType === 'word-chain') {
      newRoom = new WordChainRoom(oldRoomCode, socket.id);
    } else {
      newRoom = new EmojiMatchRoom(oldRoomCode, socket.id);
    }
    
    // Re-add all players to new room
    playersList.forEach(player => {
      if (gameType === 'word-chain') {
        newRoom.addPlayer(player.id, player.name);
      } else {
        newRoom.addPlayer(player.id, player.name);
      }
      // Update player game type
      const pData = players.get(player.id);
      if (pData) {
        pData.gameType = gameType;
      }
    });
    
    rooms.set(oldRoomCode, newRoom);
    
    // Notify all players in room
    io.to(oldRoomCode).emit('room-joined', {
      roomCode: oldRoomCode,
      players: newRoom.getPlayersList(),
      gameType: newRoom.gameType,
      gameState: newRoom.getGameState(),
      wordChain: newRoom.gameType === 'word-chain' ? newRoom.wordChain : null,
      currentPuzzle: newRoom.gameType === 'emoji-match' ? newRoom.currentPuzzle : null,
      guesses: newRoom.gameType === 'emoji-match' ? newRoom.guesses : null
    });
    
    io.to(oldRoomCode).emit('chat-message', {
      sender: 'System',
      message: `Game switched to ${gameType === 'word-chain' ? 'Word Chain' : 'Emoji Match'}`,
      isSystem: true
    });
    
    console.log(`Room ${oldRoomCode} switched to ${gameType}`);
  });
  
  // Word Chain: Submit word
  socket.on('submit-word', (data) => {
    const { word } = data;
    const playerData = players.get(socket.id);
    
    if (!playerData) {
      socket.emit('error', 'You are not in a room');
      return;
    }
    
    const room = rooms.get(playerData.roomCode);
    if (!room || room.gameType !== 'word-chain') {
      socket.emit('error', 'Word Chain room not found');
      return;
    }
    
    const currentPlayer = room.getCurrentPlayer();
    if (!currentPlayer || currentPlayer.id !== socket.id) {
      socket.emit('error', "It's not your turn");
      return;
    }
    
    const result = room.addWordToChain(word, socket.id);
    
    if (!result.valid) {
      socket.emit('error', result.reason);
      return;
    }
    
    const nextPlayer = room.setNextPlayer();
    room.resetTimer();
    
    io.to(room.code).emit('wordchain-word-submitted', {
      word: word,
      playerName: playerData.playerName,
      lastLetter: result.lastLetter,
      players: room.getPlayersList()
    });
    
    io.to(room.code).emit('wordchain-turn-update', {
      currentPlayer: nextPlayer.name,
      currentPlayerId: nextPlayer.id
    });
    
    io.to(room.code).emit('wordchain-game-state', room.getGameState());
  });
  
  // Emoji Match: Submit guess
  socket.on('submit-guess', (data) => {
    const { guess } = data;
    const playerData = players.get(socket.id);
    
    if (!playerData) {
      socket.emit('error', 'You are not in a room');
      return;
    }
    
    const room = rooms.get(playerData.roomCode);
    if (!room || room.gameType !== 'emoji-match') {
      socket.emit('error', 'Emoji Match room not found');
      return;
    }
    
    const currentPlayer = room.getCurrentPlayer();
    if (!currentPlayer || currentPlayer.id !== socket.id) {
      socket.emit('error', "It's not your turn");
      return;
    }
    
    const result = room.submitGuess(guess, socket.id);
    
    io.to(room.code).emit('emojimatch-guess-submitted', {
      guess: guess,
      playerName: playerData.playerName,
      isCorrect: result.isCorrect,
      players: room.getPlayersList()
    });
    
    if (!result.isCorrect) {
      // If guess is wrong, move to next player
      const nextPlayer = room.setNextPlayer();
      room.resetTimer();
      
      io.to(room.code).emit('emojimatch-turn-update', {
        currentPlayer: nextPlayer.name,
        currentPlayerId: nextPlayer.id
      });
      
      io.to(room.code).emit('emojimatch-game-state', room.getGameState());
    }
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
    
    io.to(room.code).emit('chat-message', {
      sender: playerData.playerName,
      message: message,
      isSystem: false
    });
  });
  
  // Start game
  socket.on('start-game', (data) => {
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
    
    if (room.hostId !== socket.id) {
      socket.emit('error', 'Only the host can start the game');
      return;
    }
    
    if (room.players.size < 2) {
      socket.emit('error', 'Need at least 2 players to start');
      return;
    }
    
    room.startGame();
    
    if (room.gameType === 'word-chain') {
      io.to(room.code).emit('wordchain-game-state', room.getGameState());
    } else {
      io.to(room.code).emit('emojimatch-game-state', room.getGameState());
      io.to(room.code).emit('emojimatch-puzzle-update', room.currentPuzzle);
      io.to(room.code).emit('emojimatch-round-update', {
        currentRound: room.currentRound,
        totalRounds: room.totalRounds
      });
    }
    
    io.to(room.code).emit('chat-message', {
      sender: 'System',
      message: `Game started! First player: ${room.getCurrentPlayer().name}`,
      isSystem: true
    });
  });
  
  // Leave room
  socket.on('leave-room', () => {
    const playerData = players.get(socket.id);
    
    if (!playerData) return;
    
    const room = rooms.get(playerData.roomCode);
    if (!room) return;
    
    const player = room.removePlayer(socket.id);
    players.delete(socket.id);
    
    socket.leave(room.code);
    
    socket.to(room.code).emit('player-left', {
      playerName: playerData.playerName,
      playerCount: room.players.size,
      players: room.getPlayersList()
    });
    
    // Update game state for remaining players
    if (room.gameType === 'word-chain') {
      io.to(room.code).emit('wordchain-game-state', room.getGameState());
    } else {
      io.to(room.code).emit('emojimatch-game-state', room.getGameState());
    }
    
    // If room is empty, delete it
    if (room.players.size === 0) {
      room.stopTimer();
      rooms.delete(room.code);
      console.log(`Room deleted: ${room.code}`);
    } else {
      // If host left, assign new host
      if (room.hostId === socket.id) {
        const newHostId = Array.from(room.players.keys())[0];
        room.hostId = newHostId;
        
        io.to(newHostId).emit('host-status', {
          isHost: true,
          players: room.getPlayersList()
        });
        
        io.to(room.code).emit('chat-message', {
          sender: 'System',
          message: `${playerData.playerName} is now the host`,
          isSystem: true
        });
      }
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
    
    const player = room.removePlayer(socket.id);
    players.delete(socket.id);
    
    io.to(room.code).emit('player-left', {
      playerName: playerData.playerName,
      playerCount: room.players.size,
      players: room.getPlayersList()
    });
    
    // Update game state for remaining players
    if (room.gameType === 'word-chain') {
      io.to(room.code).emit('wordchain-game-state', room.getGameState());
    } else {
      io.to(room.code).emit('emojimatch-game-state', room.getGameState());
    }
    
    if (room.players.size === 0) {
      room.stopTimer();
      rooms.delete(room.code);
      console.log(`Room deleted: ${room.code}`);
    } else {
      if (room.hostId === socket.id) {
        const newHostId = Array.from(room.players.keys())[0];
        room.hostId = newHostId;
        
        io.to(newHostId).emit('host-status', {
          isHost: true,
          players: room.getPlayersList()
        });
        
        io.to(room.code).emit('chat-message', {
          sender: 'System',
          message: `${playerData.playerName} is now the host`,
          isSystem: true
        });
      }
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
