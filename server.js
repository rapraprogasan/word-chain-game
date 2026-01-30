// Complete Server JavaScript for 4 Games
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
const rooms = new Map();
const players = new Map();

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

// Emoji options for racers
const raceEmojis = ['🚗', '🚕', '🚙', '🚌', '🚓', '🚑', '🚒', '🚐', '🚚', '🚛', '🚜', '🏎️', '🏍️', '🚲', '🛵', '🚨'];

// Room base class
class GameRoom {
  constructor(code, hostId, gameType) {
    this.code = code;
    this.hostId = hostId;
    this.players = new Map();
    this.gameActive = false;
    this.gameType = gameType;
  }
  
  addPlayer(socketId, playerName) {
    const player = {
      id: socketId,
      name: playerName,
      score: 0,
      isCurrentPlayer: this.players.size === 0
    };
    
    this.players.set(socketId, player);
    return player;
  }
  
  removePlayer(socketId) {
    const player = this.players.get(socketId);
    this.players.delete(socketId);
    return player;
  }
  
  getPlayersList() {
    return Array.from(this.players.values());
  }
  
  getGameState() {
    return {
      gameActive: this.gameActive,
      gameType: this.gameType
    };
  }
}

// Word Chain Room
class WordChainRoom extends GameRoom {
  constructor(code, hostId) {
    super(code, hostId, 'word-chain');
    this.wordChain = [];
    this.currentPlayerIndex = 0;
    this.timer = null;
    this.timeLeft = 30;
    this.usedWords = new Set();
  }
  
  addPlayer(socketId, playerName) {
    const player = super.addPlayer(socketId, playerName);
    
    if (this.players.size === 1) {
      player.isCurrentPlayer = true;
    }
    
    return player;
  }
  
  removePlayer(socketId) {
    const player = super.removePlayer(socketId);
    
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

// Emoji Match Room
class EmojiMatchRoom extends GameRoom {
  constructor(code, hostId) {
    super(code, hostId, 'emoji-match');
    this.currentPlayerIndex = 0;
    this.timer = null;
    this.timeLeft = 60;
    this.currentPuzzle = null;
    this.guesses = [];
    this.currentRound = 1;
    this.totalRounds = 5;
    this.usedPuzzles = new Set();
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
    let winnerName = 'No one';
    let highestScore = -1;
    
    this.players.forEach(player => {
      if (player.score > highestScore) {
        highestScore = player.score;
        winner = player.id;
        winnerName = player.name;
      }
    });
    
    io.to(this.code).emit('game-over', {
      winner: winnerName,
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

// Flappy Bird Room
class FlappyBirdRoom extends GameRoom {
  constructor(code, hostId) {
    super(code, hostId, 'flappy-bird');
    this.gameActive = false;
    this.pipes = [];
    this.gameLoop = null;
    this.gameSpeed = 5;
    this.pipeGap = 150;
    this.pipeWidth = 60;
    this.pipeFrequency = 120; // frames
    this.frameCount = 0;
    this.highScore = 0;
    this.birdColors = ['#FFD700', '#FF4500', '#32CD32', '#1E90FF', '#8A2BE2'];
    this.playerBirds = new Map();
  }
  
  addPlayer(socketId, playerName) {
    const player = super.addPlayer(socketId, playerName);
    
    // Create bird for player
    const bird = {
      id: socketId,
      name: playerName,
      x: 100,
      y: 250,
      velocity: 0,
      gravity: 0.5,
      jumpPower: -10,
      radius: 15,
      alive: true,
      score: 0,
      color: this.birdColors[this.players.size - 1] || '#FFD700',
      lastPipe: null
    };
    
    this.playerBirds.set(socketId, bird);
    return player;
  }
  
  removePlayer(socketId) {
    super.removePlayer(socketId);
    this.playerBirds.delete(socketId);
  }
  
  startGame() {
    this.gameActive = true;
    this.pipes = [];
    this.frameCount = 0;
    
    // Reset all birds
    this.playerBirds.forEach(bird => {
      bird.x = 100;
      bird.y = 250;
      bird.velocity = 0;
      bird.alive = true;
      bird.score = 0;
      bird.lastPipe = null;
    });
    
    // Start game loop
    if (this.gameLoop) {
      clearInterval(this.gameLoop);
    }
    
    this.gameLoop = setInterval(() => {
      this.updateGame();
    }, 1000 / 60); // 60 FPS
  }
  
  updateGame() {
    if (!this.gameActive) return;
    
    this.frameCount++;
    
    // Add new pipes
    if (this.frameCount % this.pipeFrequency === 0) {
      this.addPipe();
    }
    
    // Update pipes
    this.pipes.forEach(pipe => {
      pipe.x -= this.gameSpeed;
    });
    
    // Remove off-screen pipes
    this.pipes = this.pipes.filter(pipe => pipe.x > -this.pipeWidth);
    
    // Update birds
    let aliveCount = 0;
    this.playerBirds.forEach(bird => {
      if (!bird.alive) return;
      
      // Apply gravity
      bird.velocity += bird.gravity;
      bird.y += bird.velocity;
      
      // Check collision with ground (canvas height = 500)
      if (bird.y + bird.radius >= 450) {
        bird.alive = false;
        bird.y = 450 - bird.radius;
      }
      
      // Check collision with ceiling
      if (bird.y - bird.radius <= 0) {
        bird.alive = false;
        bird.y = bird.radius;
      }
      
      // Check collision with pipes
      for (const pipe of this.pipes) {
        if (this.checkCollision(bird, pipe)) {
          bird.alive = false;
          break;
        }
        
        // Score point if passed pipe
        if (!bird.lastPipe || pipe.id > bird.lastPipe) {
          if (bird.x > pipe.x + this.pipeWidth) {
            bird.score++;
            bird.lastPipe = pipe.id;
            if (bird.score > this.highScore) {
              this.highScore = bird.score;
            }
          }
        }
      }
      
      if (bird.alive) aliveCount++;
    });
    
    // Check if game over (all birds dead)
    if (aliveCount === 0) {
      this.endGame();
    }
    
    // Broadcast game state
    this.broadcastGameState();
  }
  
  addPipe() {
    const minHeight = 50;
    const maxHeight = 350;
    const topHeight = Math.floor(Math.random() * (maxHeight - minHeight)) + minHeight;
    const gap = this.pipeGap;
    
    this.pipes.push({
      id: Date.now(),
      x: 800,
      topHeight: topHeight,
      bottomHeight: 500 - topHeight - gap
    });
  }
  
  checkCollision(bird, pipe) {
    // Check collision with top pipe
    if (bird.x + bird.radius > pipe.x && bird.x - bird.radius < pipe.x + this.pipeWidth) {
      if (bird.y - bird.radius < pipe.topHeight) {
        return true;
      }
    }
    
    // Check collision with bottom pipe
    if (bird.x + bird.radius > pipe.x && bird.x - bird.radius < pipe.x + this.pipeWidth) {
      if (bird.y + bird.radius > 500 - pipe.bottomHeight) {
        return true;
      }
    }
    
    return false;
  }
  
  flapBird(socketId) {
    const bird = this.playerBirds.get(socketId);
    if (bird && bird.alive) {
      bird.velocity = bird.jumpPower;
    }
  }
  
  broadcastGameState() {
    const playersData = {};
    this.playerBirds.forEach((bird, id) => {
      playersData[id] = {
        x: bird.x,
        y: bird.y,
        alive: bird.alive,
        score: bird.score,
        color: bird.color,
        name: bird.name
      };
    });
    
    io.to(this.code).emit('flappybird-update', {
      players: playersData,
      pipes: this.pipes,
      highScore: this.highScore
    });
    
    // Update scores in player objects
    this.players.forEach(player => {
      const bird = this.playerBirds.get(player.id);
      if (bird) {
        player.score = bird.score;
        player.alive = bird.alive;
      }
    });
  }
  
  endGame() {
    this.gameActive = false;
    if (this.gameLoop) {
      clearInterval(this.gameLoop);
      this.gameLoop = null;
    }
    
    // Find winner
    let winner = null;
    let winnerName = 'No one';
    let highestScore = -1;
    
    this.playerBirds.forEach(bird => {
      if (bird.score > highestScore) {
        highestScore = bird.score;
        winner = bird.id;
        winnerName = bird.name;
      }
    });
    
    io.to(this.code).emit('flappybird-game-over', {
      winner: winner,
      winnerName: winnerName,
      winningScore: highestScore,
      highScore: this.highScore
    });
  }
  
  getGameState() {
    const aliveCount = Array.from(this.playerBirds.values()).filter(bird => bird.alive).length;
    
    return {
      gameActive: this.gameActive,
      activePlayers: aliveCount,
      highScore: this.highScore
    };
  }
}

// Emoji Race Room
class EmojiRaceRoom extends GameRoom {
  constructor(code, hostId) {
    super(code, hostId, 'emoji-race');
    this.gameActive = false;
    this.raceLength = 1000; // pixels
    this.playerRacers = new Map();
    this.raceKeys = {
      '1': 'A',
      '2': 'L',
      '3': 'F',
      '4': 'J'
    };
    this.raceEmojis = [...raceEmojis];
    this.winner = null;
  }
  
  addPlayer(socketId, playerName) {
    const player = super.addPlayer(socketId, playerName);
    
    // Assign emoji and key to player
    const playerIndex = this.players.size - 1;
    const emoji = this.raceEmojis[playerIndex % this.raceEmojis.length];
    const keyNumber = (playerIndex % 4) + 1;
    
    const racer = {
      id: socketId,
      name: playerName,
      emoji: emoji,
      position: 0,
      speed: 0,
      key: this.raceKeys[keyNumber.toString()],
      keyNumber: keyNumber,
      finished: false,
      finishTime: null
    };
    
    this.playerRacers.set(socketId, racer);
    return player;
  }
  
  removePlayer(socketId) {
    super.removePlayer(socketId);
    this.playerRacers.delete(socketId);
  }
  
  startGame() {
    this.gameActive = true;
    this.winner = null;
    
    // Reset all racers
    this.playerRacers.forEach(racer => {
      racer.position = 0;
      racer.speed = 0;
      racer.finished = false;
      racer.finishTime = null;
    });
    
    io.to(this.code).emit('emojirace-game-state', {
      gameActive: true,
      trackLength: 100,
      speed: 'Normal',
      winner: null
    });
  }
  
  keyPress(socketId, playerNumber) {
    if (!this.gameActive) return;
    
    const racer = this.playerRacers.get(socketId);
    if (!racer || racer.finished) return;
    
    // Increase speed based on key presses
    racer.speed = Math.min(20, racer.speed + 0.5);
    
    // Move racer
    racer.position += racer.speed;
    
    // Check if finished
    if (racer.position >= this.raceLength && !racer.finished) {
      racer.finished = true;
      racer.finishTime = Date.now();
      
      // Check if this is the winner
      if (!this.winner) {
        this.winner = socketId;
        this.endGame();
      }
    }
    
    // Apply friction
    racer.speed = Math.max(0, racer.speed - 0.1);
    
    // Broadcast update
    this.broadcastGameState();
  }
  
  broadcastGameState() {
    const playersData = {};
    this.playerRacers.forEach((racer, id) => {
      playersData[id] = {
        position: racer.position,
        speed: racer.speed,
        emoji: racer.emoji,
        name: racer.name,
        finished: racer.finished,
        key: racer.key
      };
    });
    
    io.to(this.code).emit('emojirace-update', {
      players: playersData
    });
    
    // Update positions in player objects
    this.players.forEach(player => {
      const racer = this.playerRacers.get(player.id);
      if (racer) {
        player.score = Math.floor(racer.position / 10); // Convert to meters
      }
    });
  }
  
  endGame() {
    this.gameActive = false;
    
    const winnerRacer = this.playerRacers.get(this.winner);
    
    io.to(this.code).emit('emojirace-game-over', {
      winner: this.winner,
      winnerName: winnerRacer ? winnerRacer.name : 'Unknown',
      winningTime: winnerRacer ? winnerRacer.finishTime : null
    });
  }
  
  getGameState() {
    const winnerRacer = this.winner ? this.playerRacers.get(this.winner) : null;
    
    return {
      gameActive: this.gameActive,
      trackLength: 100,
      speed: 'Normal',
      winner: winnerRacer ? winnerRacer.name : null
    };
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
      socket.emit('error', `This room is playing ${getGameName(rooms.get(roomCode).gameType)}. Please switch game type or create a new room.`);
      return;
    }
    
    // Create room if it doesn't exist
    if (!rooms.has(roomCode)) {
      let newRoom;
      switch(gameType) {
        case 'word-chain':
          newRoom = new WordChainRoom(roomCode, socket.id);
          break;
        case 'emoji-match':
          newRoom = new EmojiMatchRoom(roomCode, socket.id);
          break;
        case 'flappy-bird':
          newRoom = new FlappyBirdRoom(roomCode, socket.id);
          break;
        case 'emoji-race':
          newRoom = new EmojiRaceRoom(roomCode, socket.id);
          break;
        default:
          socket.emit('error', 'Invalid game type');
          return;
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
      responseData.wordChain = room.wordChain || [];
    } else if (room.gameType === 'emoji-match') {
      responseData.currentPuzzle = room.currentPuzzle;
      responseData.guesses = room.guesses || [];
    } else if (room.gameType === 'flappy-bird') {
      const playersData = {};
      room.playerBirds.forEach((bird, id) => {
        playersData[id] = {
          x: bird.x,
          y: bird.y,
          alive: bird.alive,
          score: bird.score,
          color: bird.color,
          name: bird.name
        };
      });
      responseData.playersData = playersData;
    } else if (room.gameType === 'emoji-race') {
      const playersData = {};
      room.playerRacers.forEach((racer, id) => {
        playersData[id] = {
          position: racer.position,
          speed: racer.speed,
          emoji: racer.emoji,
          name: racer.name,
          finished: racer.finished,
          key: racer.key
        };
      });
      responseData.playersData = playersData;
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
    } else if (room.gameType === 'emoji-match') {
      io.to(roomCode).emit('emojimatch-game-state', room.getGameState());
    } else if (room.gameType === 'flappy-bird') {
      io.to(roomCode).emit('flappybird-game-state', room.getGameState());
    } else if (room.gameType === 'emoji-race') {
      io.to(roomCode).emit('emojirace-game-state', room.getGameState());
    }
    
    console.log(`${username} joined ${gameType} room ${roomCode}`);
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
  
  // Flappy Bird: Start game
  socket.on('start-flappy-game', () => {
    const playerData = players.get(socket.id);
    if (!playerData) return;
    
    const room = rooms.get(playerData.roomCode);
    if (!room || room.gameType !== 'flappy-bird') return;
    
    if (room.hostId !== socket.id) {
      socket.emit('error', 'Only the host can start the game');
      return;
    }
    
    room.startGame();
    io.to(room.code).emit('flappybird-game-state', room.getGameState());
  });
  
  // Flappy Bird: Flap
  socket.on('flap-bird', () => {
    const playerData = players.get(socket.id);
    if (!playerData) return;
    
    const room = rooms.get(playerData.roomCode);
    if (!room || room.gameType !== 'flappy-bird') return;
    
    room.flapBird(socket.id);
  });
  
  // Flappy Bird: Restart game
  socket.on('restart-flappy-game', () => {
    const playerData = players.get(socket.id);
    if (!playerData) return;
    
    const room = rooms.get(playerData.roomCode);
    if (!room || room.gameType !== 'flappy-bird') return;
    
    if (room.hostId !== socket.id) {
      socket.emit('error', 'Only the host can restart the game');
      return;
    }
    
    room.startGame();
    io.to(room.code).emit('flappybird-game-state', room.getGameState());
  });
  
  // Emoji Race: Start game
  socket.on('start-race-game', () => {
    const playerData = players.get(socket.id);
    if (!playerData) return;
    
    const room = rooms.get(playerData.roomCode);
    if (!room || room.gameType !== 'emoji-race') return;
    
    if (room.hostId !== socket.id) {
      socket.emit('error', 'Only the host can start the game');
      return;
    }
    
    room.startGame();
  });
  
  // Emoji Race: Key press
  socket.on('race-key-press', (data) => {
    const playerData = players.get(socket.id);
    if (!playerData) return;
    
    const room = rooms.get(playerData.roomCode);
    if (!room || room.gameType !== 'emoji-race') return;
    
    room.keyPress(socket.id, data.playerNumber);
  });
  
  // Emoji Race: Reset game
  socket.on('reset-race-game', () => {
    const playerData = players.get(socket.id);
    if (!playerData) return;
    
    const room = rooms.get(playerData.roomCode);
    if (!room || room.gameType !== 'emoji-race') return;
    
    if (room.hostId !== socket.id) {
      socket.emit('error', 'Only the host can reset the game');
      return;
    }
    
    room.startGame();
  });
  
  // Start game (for word chain and emoji match)
  socket.on('start-game', (data) => {
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
    
    if (room.hostId !== socket.id) {
      socket.emit('error', 'Only the host can start the game');
      return;
    }
    
    if (room.players.size < 2) {
      socket.emit('error', 'Need at least 2 players to start');
      return;
    }
    
    if (room.gameType === 'word-chain' || room.gameType === 'emoji-match') {
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
    } else if (room.gameType === 'emoji-match') {
      io.to(room.code).emit('emojimatch-game-state', room.getGameState());
    } else if (room.gameType === 'flappy-bird') {
      io.to(room.code).emit('flappybird-game-state', room.getGameState());
    } else if (room.gameType === 'emoji-race') {
      io.to(room.code).emit('emojirace-game-state', room.getGameState());
    }
    
    // If room is empty, delete it
    if (room.players.size === 0) {
      // Stop game loops if running
      if (room.gameType === 'flappy-bird' && room.gameLoop) {
        clearInterval(room.gameLoop);
      }
      
      // Stop timers
      if (room.gameType === 'word-chain' || room.gameType === 'emoji-match') {
        room.stopTimer();
      }
      
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
    
    if (room.players.size === 0) {
      // Stop game loops if running
      if (room.gameType === 'flappy-bird' && room.gameLoop) {
        clearInterval(room.gameLoop);
      }
      
      // Stop timers
      if (room.gameType === 'word-chain' || room.gameType === 'emoji-match') {
        room.stopTimer();
      }
      
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

function getGameName(gameType) {
  const names = {
    'word-chain': 'Word Chain',
    'emoji-match': 'Emoji Match', 
    'flappy-bird': 'Flappy Bird',
    'emoji-race': 'Emoji Race'
  };
  return names[gameType] || gameType;
}

// Serve main page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
