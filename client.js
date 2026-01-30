// Complete Client JavaScript for 4 Games
document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const connectionSection = document.getElementById('connection-section');
    const wordchainSection = document.getElementById('wordchain-section');
    const emojimatchSection = document.getElementById('emojimatch-section');
    const flappybirdSection = document.getElementById('flappybird-section');
    const emojiraceSection = document.getElementById('emojirace-section');
    const chatSection = document.getElementById('chat-section');
    
    // Connection elements
    const usernameInput = document.getElementById('username');
    const roomCodeInput = document.getElementById('room-code');
    const joinRoomBtn = document.getElementById('join-room');
    const createRoomBtn = document.getElementById('create-room');
    const statusElement = document.getElementById('status');
    const gameLinkElement = document.getElementById('game-link');
    
    // Game selection
    const gameOptions = document.querySelectorAll('.game-option');
    const selectedGame = { type: 'word-chain' };
    
    // Word Chain elements
    const leaveWordchainBtn = document.getElementById('leave-wordchain');
    const switchGameWordchainBtn = document.getElementById('switch-game-wordchain');
    const wordchainRoomElement = document.getElementById('wordchain-room');
    const wordchainPlayerCountElement = document.getElementById('wordchain-player-count');
    const wordchainPlayersListElement = document.getElementById('wordchain-players-list');
    const wordChainElement = document.getElementById('word-chain');
    const wordchainCurrentPlayerElement = document.getElementById('wordchain-current-player');
    const wordchainTimerElement = document.getElementById('wordchain-timer');
    const wordchainPlayerScoreElement = document.getElementById('wordchain-player-score');
    const wordInput = document.getElementById('word-input');
    const submitWordBtn = document.getElementById('submit-word');
    const lastLetterElement = document.getElementById('last-letter');
    
    // Emoji Match elements
    const leaveEmojimatchBtn = document.getElementById('leave-emojimatch');
    const switchGameEmojimatchBtn = document.getElementById('switch-game-emojimatch');
    const emojimatchRoomElement = document.getElementById('emojimatch-room');
    const emojimatchPlayerCountElement = document.getElementById('emojimatch-player-count');
    const emojimatchPlayersListElement = document.getElementById('emojimatch-players-list');
    const emojiPuzzleElement = document.getElementById('emoji-puzzle');
    const emojimatchCurrentPlayerElement = document.getElementById('emojimatch-current-player');
    const emojimatchTimerElement = document.getElementById('emojimatch-timer');
    const emojiRoundElement = document.getElementById('emoji-round');
    const emojimatchPlayerScoreElement = document.getElementById('emojimatch-player-score');
    const emojiGuessInput = document.getElementById('emoji-guess');
    const submitGuessBtn = document.getElementById('submit-guess');
    const emojiCategoryElement = document.getElementById('emoji-category');
    const emojiGuessesElement = document.getElementById('emoji-guesses');
    
    // Flappy Bird elements
    const leaveFlappybirdBtn = document.getElementById('leave-flappybird');
    const switchGameFlappybirdBtn = document.getElementById('switch-game-flappybird');
    const flappybirdRoomElement = document.getElementById('flappybird-room');
    const flappybirdPlayerCountElement = document.getElementById('flappybird-player-count');
    const flappybirdPlayersListElement = document.getElementById('flappybird-players-list');
    const flappyCanvas = document.getElementById('flappy-canvas');
    const flappyHighscoreElement = document.getElementById('flappy-highscore');
    const flappyStatusElement = document.getElementById('flappy-status');
    const flappyActivePlayersElement = document.getElementById('flappy-active-players');
    const flapBtn = document.getElementById('flap-btn');
    const startFlappyBtn = document.getElementById('start-flappy-btn');
    const restartFlappyBtn = document.getElementById('restart-flappy-btn');
    
    // Emoji Race elements
    const leaveEmojiraceBtn = document.getElementById('leave-emojirace');
    const switchGameEmojiraceBtn = document.getElementById('switch-game-emojirace');
    const emojiraceRoomElement = document.getElementById('emojirace-room');
    const emojiracePlayerCountElement = document.getElementById('emojirace-player-count');
    const emojiracePlayersListElement = document.getElementById('emojirace-players-list');
    const raceTrackElement = document.getElementById('race-track');
    const raceStatusElement = document.getElementById('race-status');
    const trackLengthElement = document.getElementById('track-length');
    const raceSpeedElement = document.getElementById('race-speed');
    const raceWinnerElement = document.getElementById('race-winner');
    const startRaceBtn = document.getElementById('start-race-btn');
    const resetRaceBtn = document.getElementById('reset-race-btn');
    const playerKeys = document.querySelectorAll('.player-key');
    
    // Chat elements (shared)
    const chatMessagesElement = document.getElementById('chat-messages');
    const chatInput = document.getElementById('chat-input');
    const sendChatBtn = document.getElementById('send-chat');
    
    // Modal elements
    const startGameModal = document.getElementById('start-game-modal');
    const startGameBtn = document.getElementById('start-game-btn');
    const waitPlayersBtn = document.getElementById('wait-players-btn');
    
    // Mobile notification
    const mobileNotification = document.getElementById('mobile-notification');
    
    // Game state
    let socket = null;
    let playerId = null;
    let currentRoom = null;
    let currentGame = null;
    let isHost = false;
    let timerInterval = null;
    
    // Word Chain specific state
    let wordchainTimeLeft = 30;
    let usedWords = new Set();
    let isMyTurnWordchain = false;
    
    // Emoji Match specific state
    let emojimatchTimeLeft = 60;
    let isMyTurnEmoji = false;
    let currentEmojiPuzzle = null;
    
    // Flappy Bird game state
    let flappyCtx = null;
    let flappyGameRunning = false;
    let flappyScore = 0;
    let flappyHighscore = 0;
    let flappyPlayers = {};
    let myFlappyBird = null;
    let flappyPipes = [];
    
    // Emoji Race game state
    let raceGameRunning = false;
    let racePlayers = {};
    let myRacer = null;
    let raceFinishLine = 1000;
    let raceKeys = {
        '1': 'A',
        '2': 'L', 
        '3': 'F',
        '4': 'J'
    };
    let keyPressCount = 0;
    
    // Initialize game
    function init() {
        // Update game link
        gameLinkElement.textContent = window.location.href;
        
        // Game selection
        gameOptions.forEach(option => {
            option.addEventListener('click', function() {
                gameOptions.forEach(opt => opt.classList.remove('active'));
                this.classList.add('active');
                selectedGame.type = this.dataset.game;
            });
        });
        
        // Event listeners
        joinRoomBtn.addEventListener('click', joinRoom);
        createRoomBtn.addEventListener('click', createRoom);
        
        // Leave buttons
        leaveWordchainBtn.addEventListener('click', leaveRoom);
        leaveEmojimatchBtn.addEventListener('click', leaveRoom);
        leaveFlappybirdBtn.addEventListener('click', leaveRoom);
        leaveEmojiraceBtn.addEventListener('click', leaveRoom);
        
        // Switch game buttons
        switchGameWordchainBtn.addEventListener('click', () => showGameSelection());
        switchGameEmojimatchBtn.addEventListener('click', () => showGameSelection());
        switchGameFlappybirdBtn.addEventListener('click', () => showGameSelection());
        switchGameEmojiraceBtn.addEventListener('click', () => showGameSelection());
        
        // Word Chain events
        submitWordBtn.addEventListener('click', submitWord);
        wordInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') submitWord();
        });
        
        // Emoji Match events
        submitGuessBtn.addEventListener('click', submitGuess);
        emojiGuessInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') submitGuess();
        });
        
        // Flappy Bird events
        flapBtn.addEventListener('click', flapBird);
        startFlappyBtn.addEventListener('click', startFlappyGame);
        restartFlappyBtn.addEventListener('click', restartFlappyGame);
        
        // Emoji Race events
        startRaceBtn.addEventListener('click', startRaceGame);
        resetRaceBtn.addEventListener('click', resetRaceGame);
        
        // Keyboard events for Emoji Race
        document.addEventListener('keydown', handleRaceKeyPress);
        
        // Chat events
        sendChatBtn.addEventListener('click', sendChatMessage);
        chatInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') sendChatMessage();
        });
        
        // Modal events
        startGameBtn.addEventListener('click', startGame);
        waitPlayersBtn.addEventListener('click', () => {
            startGameModal.classList.add('hidden');
        });
        
        // Initialize Flappy Bird canvas
        if (flappyCanvas) {
            flappyCtx = flappyCanvas.getContext('2d');
            flappyCanvas.addEventListener('click', flapBird);
            flappyCanvas.addEventListener('touchstart', function(e) {
                e.preventDefault();
                flapBird();
            });
            
            // Also handle space key for flappy bird
            document.addEventListener('keydown', function(e) {
                if (e.code === 'Space' && currentGame === 'flappy-bird' && flappyGameRunning) {
                    e.preventDefault();
                    flapBird();
                }
            });
        }
        
        // Check if mobile device
        if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
            setTimeout(() => {
                mobileNotification.classList.remove('hidden');
                setTimeout(() => {
                    mobileNotification.classList.add('hidden');
                }, 5000);
            }, 3000);
        }
        
        // Initialize with a random room code if empty
        if (!roomCodeInput.value) {
            roomCodeInput.value = generateRoomCode();
        }
    }
    
    // Generate a random room code
    function generateRoomCode() {
        const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const numbers = '0123456789';
        let code = '';
        
        for (let i = 0; i < 4; i++) {
            code += letters.charAt(Math.floor(Math.random() * letters.length));
        }
        
        for (let i = 0; i < 3; i++) {
            code += numbers.charAt(Math.floor(Math.random() * numbers.length));
        }
        
        return code;
    }
    
    // Connect to server
    function connectToServer() {
        const serverUrl = window.location.origin;
        socket = io(serverUrl);
        
        socket.on('connect', () => {
            playerId = socket.id;
            updateStatus('Connected to server', 'success');
        });
        
        socket.on('disconnect', () => {
            updateStatus('Disconnected from server', 'error');
        });
        
        socket.on('error', (message) => {
            updateStatus(`Error: ${message}`, 'error');
            addChatMessage('System', message, true);
        });
        
        socket.on('room-joined', (data) => {
            handleRoomJoined(data);
        });
        
        socket.on('player-joined', (data) => {
            handlePlayerJoined(data);
        });
        
        socket.on('player-left', (data) => {
            handlePlayerLeft(data);
        });
        
        // Word Chain events
        socket.on('wordchain-game-state', (data) => {
            updateWordChainGameState(data);
        });
        
        socket.on('wordchain-turn-update', (data) => {
            handleWordChainTurnUpdate(data);
        });
        
        socket.on('wordchain-word-submitted', (data) => {
            handleWordSubmitted(data);
        });
        
        socket.on('wordchain-timer-update', (data) => {
            updateWordChainTimer(data);
        });
        
        // Emoji Match events
        socket.on('emojimatch-game-state', (data) => {
            updateEmojiMatchGameState(data);
        });
        
        socket.on('emojimatch-turn-update', (data) => {
            handleEmojiMatchTurnUpdate(data);
        });
        
        socket.on('emojimatch-puzzle-update', (data) => {
            updateEmojiPuzzle(data);
        });
        
        socket.on('emojimatch-guess-submitted', (data) => {
            handleGuessSubmitted(data);
        });
        
        socket.on('emojimatch-timer-update', (data) => {
            updateEmojiMatchTimer(data);
        });
        
        socket.on('emojimatch-round-update', (data) => {
            updateEmojiRound(data);
        });
        
        // Flappy Bird events
        socket.on('flappybird-game-state', (data) => {
            updateFlappyBirdGameState(data);
        });
        
        socket.on('flappybird-update', (data) => {
            updateFlappyBirdGame(data);
        });
        
        socket.on('flappybird-player-update', (data) => {
            updateFlappyBirdPlayer(data);
        });
        
        socket.on('flappybird-game-over', (data) => {
            handleFlappyBirdGameOver(data);
        });
        
        // Emoji Race events
        socket.on('emojirace-game-state', (data) => {
            updateEmojiRaceGameState(data);
        });
        
        socket.on('emojirace-update', (data) => {
            updateEmojiRaceGame(data);
        });
        
        socket.on('emojirace-player-move', (data) => {
            updateEmojiRacePlayer(data);
        });
        
        socket.on('emojirace-game-over', (data) => {
            handleEmojiRaceGameOver(data);
        });
        
        // Shared events
        socket.on('chat-message', (data) => {
            addChatMessage(data.sender, data.message, data.isSystem, data.type);
        });
        
        socket.on('game-over', (data) => {
            handleGameOver(data);
        });
        
        socket.on('host-status', (data) => {
            isHost = data.isHost;
            if (isHost && data.players.length >= 2) {
                startGameModal.classList.remove('hidden');
            }
        });
    }
    
    // Join existing room
    function joinRoom() {
        const username = usernameInput.value.trim();
        const roomCode = roomCodeInput.value.trim().toUpperCase();
        const gameType = selectedGame.type;
        
        if (!username) {
            alert('Please enter your name');
            return;
        }
        
        if (!roomCode) {
            alert('Please enter a room code');
            return;
        }
        
        if (!socket || !socket.connected) {
            connectToServer();
            
            setTimeout(() => {
                socket.emit('join-room', { username, roomCode, gameType });
            }, 500);
        } else {
            socket.emit('join-room', { username, roomCode, gameType });
        }
    }
    
    // Create new room
    function createRoom() {
        const username = usernameInput.value.trim();
        const roomCode = generateRoomCode();
        const gameType = selectedGame.type;
        
        if (!username) {
            alert('Please enter your name');
            return;
        }
        
        roomCodeInput.value = roomCode;
        
        if (!socket || !socket.connected) {
            connectToServer();
            
            setTimeout(() => {
                socket.emit('join-room', { username, roomCode, gameType });
            }, 500);
        } else {
            socket.emit('join-room', { username, roomCode, gameType });
        }
    }
    
    // Show game selection
    function showGameSelection() {
        showConnectionScreen();
    }
    
    // Leave room
    function leaveRoom() {
        if (socket && socket.connected) {
            socket.emit('leave-room');
            resetGame();
            showConnectionScreen();
        }
    }
    
    // Start game (host only)
    function startGame() {
        if (socket && socket.connected && isHost) {
            socket.emit('start-game', { gameType: currentGame });
            startGameModal.classList.add('hidden');
        }
    }
    
    // Word Chain functions
    function submitWord() {
        if (!isMyTurnWordchain) {
            addChatMessage('System', "It's not your turn!", true);
            return;
        }
        
        const word = wordInput.value.trim().toLowerCase();
        
        if (!word) {
            addChatMessage('System', "Please enter a word", true);
            return;
        }
        
        if (word.length < 2) {
            addChatMessage('System', "Word must be at least 2 letters", true);
            return;
        }
        
        if (usedWords.has(word)) {
            addChatMessage('System', "Word already used in this game!", true);
            return;
        }
        
        socket.emit('submit-word', { word });
        wordInput.value = '';
    }
    
    // Emoji Match functions
    function submitGuess() {
        if (!isMyTurnEmoji) {
            addChatMessage('System', "It's not your turn!", true);
            return;
        }
        
        const guess = emojiGuessInput.value.trim();
        
        if (!guess) {
            addChatMessage('System', "Please enter your guess", true);
            return;
        }
        
        socket.emit('submit-guess', { guess });
        emojiGuessInput.value = '';
    }
    
    // Flappy Bird functions
    function startFlappyGame() {
        if (socket && socket.connected) {
            socket.emit('start-flappy-game');
            flappyGameRunning = true;
            flappyStatusElement.textContent = 'Playing';
        }
    }
    
    function restartFlappyGame() {
        if (socket && socket.connected) {
            socket.emit('restart-flappy-game');
            flappyScore = 0;
            flappyStatusElement.textContent = 'Ready';
        }
    }
    
    function flapBird() {
        if (socket && socket.connected && flappyGameRunning) {
            socket.emit('flap-bird');
        }
    }
    
    // Emoji Race functions
    function startRaceGame() {
        if (socket && socket.connected) {
            socket.emit('start-race-game');
            raceGameRunning = true;
            raceStatusElement.textContent = 'Racing!';
        }
    }
    
    function resetRaceGame() {
        if (socket && socket.connected) {
            socket.emit('reset-race-game');
            raceGameRunning = false;
            raceStatusElement.textContent = 'Ready';
        }
    }
    
    function handleRaceKeyPress(e) {
        if (!raceGameRunning || !socket || !socket.connected) return;
        
        const key = e.key.toUpperCase();
        let playerNumber = null;
        
        // Find which player this key belongs to
        for (const [playerNum, keyChar] of Object.entries(raceKeys)) {
            if (key === keyChar) {
                playerNumber = playerNum;
                break;
            }
        }
        
        if (playerNumber && racePlayers[playerId] && racePlayers[playerId].position < raceFinishLine) {
            socket.emit('race-key-press', { playerNumber });
            keyPressCount++;
            
            // Visual feedback
            playerKeys.forEach(keyEl => {
                if (keyEl.dataset.player === playerNumber) {
                    keyEl.classList.add('active');
                    setTimeout(() => {
                        keyEl.classList.remove('active');
                    }, 100);
                }
            });
        }
    }
    
    // Send chat message
    function sendChatMessage() {
        const message = chatInput.value.trim();
        
        if (!message) return;
        
        socket.emit('chat-message', { message });
        chatInput.value = '';
    }
    
    // Handle room joined
    function handleRoomJoined(data) {
        currentRoom = data.roomCode;
        currentGame = data.gameType;
        updateStatus(`Joined ${data.gameType} room: ${data.roomCode}`, 'success');
        
        // Update UI based on game type
        if (data.gameType === 'word-chain') {
            showWordChainGame(data);
        } else if (data.gameType === 'emoji-match') {
            showEmojiMatchGame(data);
        } else if (data.gameType === 'flappy-bird') {
            showFlappyBirdGame(data);
        } else if (data.gameType === 'emoji-race') {
            showEmojiRaceGame(data);
        }
        
        // Show chat section
        chatSection.classList.remove('hidden');
        
        addChatMessage('System', `Welcome to ${getGameName(data.gameType)} in room ${data.roomCode}! Share code: ${data.roomCode}`, true);
    }
    
    function getGameName(gameType) {
        const games = {
            'word-chain': 'Word Chain',
            'emoji-match': 'Emoji Match',
            'flappy-bird': 'Flappy Bird',
            'emoji-race': 'Emoji Race'
        };
        return games[gameType] || gameType;
    }
    
    // Show Word Chain game
    function showWordChainGame(data) {
        wordchainRoomElement.textContent = data.roomCode;
        wordchainPlayerCountElement.textContent = `${data.players.length} player${data.players.length !== 1 ? 's' : ''}`;
        
        updateWordChainPlayerList(data.players);
        
        // Update word chain if game in progress
        if (data.wordChain && data.wordChain.length > 0) {
            updateWordChain(data.wordChain);
            usedWords = new Set(data.wordChain.map(item => item.word.toLowerCase()));
            
            // Set last letter
            const lastWord = data.wordChain[data.wordChain.length - 1].word;
            lastLetterElement.textContent = lastWord.charAt(lastWord.length - 1).toUpperCase();
        } else {
            lastLetterElement.textContent = 'Any (first word)';
        }
        
        // Update game state
        if (data.gameState) {
            updateWordChainGameState(data.gameState);
        }
        
        showGameScreen('word-chain');
    }
    
    // Show Emoji Match game
    function showEmojiMatchGame(data) {
        emojimatchRoomElement.textContent = data.roomCode;
        emojimatchPlayerCountElement.textContent = `${data.players.length} player${data.players.length !== 1 ? 's' : ''}`;
        
        updateEmojiMatchPlayerList(data.players);
        
        // Update emoji puzzle if game in progress
        if (data.currentPuzzle) {
            updateEmojiPuzzle(data.currentPuzzle);
        }
        
        // Update guesses if any
        if (data.guesses && data.guesses.length > 0) {
            updateEmojiGuesses(data.guesses);
        }
        
        // Update game state
        if (data.gameState) {
            updateEmojiMatchGameState(data.gameState);
        }
        
        showGameScreen('emoji-match');
    }
    
    // Show Flappy Bird game
    function showFlappyBirdGame(data) {
        flappybirdRoomElement.textContent = data.roomCode;
        flappybirdPlayerCountElement.textContent = `${data.players.length} player${data.players.length !== 1 ? 's' : ''}`;
        
        updateFlappyBirdPlayerList(data.players);
        
        if (data.gameState) {
            updateFlappyBirdGameState(data.gameState);
        }
        
        if (data.playersData) {
            flappyPlayers = data.playersData;
            drawFlappyBirdGame();
        }
        
        showGameScreen('flappy-bird');
        
        // Start game loop
        requestAnimationFrame(flappyGameLoop);
    }
    
    // Show Emoji Race game
    function showEmojiRaceGame(data) {
        emojiraceRoomElement.textContent = data.roomCode;
        emojiracePlayerCountElement.textContent = `${data.players.length} player${data.players.length !== 1 ? 's' : ''}`;
        
        updateEmojiRacePlayerList(data.players);
        
        if (data.gameState) {
            updateEmojiRaceGameState(data.gameState);
        }
        
        if (data.playersData) {
            racePlayers = data.playersData;
            drawEmojiRaceGame();
        }
        
        showGameScreen('emoji-race');
    }
    
    // Update Word Chain game state
    function updateWordChainGameState(data) {
        // Update current player
        wordchainCurrentPlayerElement.textContent = data.currentPlayer;
        
        // Check if it's my turn
        isMyTurnWordchain = data.currentPlayerId === playerId;
        
        // Update input field
        if (isMyTurnWordchain) {
            wordInput.disabled = false;
            wordInput.placeholder = "Your turn! Type a word...";
            wordInput.focus();
            submitWordBtn.disabled = false;
            wordchainCurrentPlayerElement.classList.add('highlight');
        } else {
            wordInput.disabled = true;
            wordInput.placeholder = `Waiting for ${data.currentPlayer}...`;
            submitWordBtn.disabled = true;
            wordchainCurrentPlayerElement.classList.remove('highlight');
        }
        
        // Update timer
        if (timerInterval) {
            clearInterval(timerInterval);
        }
        
        wordchainTimeLeft = data.timeLeft;
        updateWordChainTimerDisplay();
        
        if (data.gameActive) {
            timerInterval = setInterval(() => {
                wordchainTimeLeft--;
                updateWordChainTimerDisplay();
                
                if (wordchainTimeLeft <= 0) {
                    clearInterval(timerInterval);
                }
            }, 1000);
        }
    }
    
    // Update Emoji Match game state
    function updateEmojiMatchGameState(data) {
        // Update current player
        emojimatchCurrentPlayerElement.textContent = data.currentPlayer;
        
        // Check if it's my turn
        isMyTurnEmoji = data.currentPlayerId === playerId;
        
        // Update input field
        if (isMyTurnEmoji) {
            emojiGuessInput.disabled = false;
            emojiGuessInput.placeholder = "Your turn! Guess the phrase...";
            emojiGuessInput.focus();
            submitGuessBtn.disabled = false;
            emojimatchCurrentPlayerElement.classList.add('highlight');
        } else {
            emojiGuessInput.disabled = true;
            emojiGuessInput.placeholder = `Waiting for ${data.currentPlayer}...`;
            submitGuessBtn.disabled = true;
            emojimatchCurrentPlayerElement.classList.remove('highlight');
        }
        
        // Update timer
        if (timerInterval) {
            clearInterval(timerInterval);
        }
        
        emojimatchTimeLeft = data.timeLeft;
        updateEmojiMatchTimerDisplay();
        
        if (data.gameActive) {
            timerInterval = setInterval(() => {
                emojimatchTimeLeft--;
                updateEmojiMatchTimerDisplay();
                
                if (emojimatchTimeLeft <= 0) {
                    clearInterval(timerInterval);
                }
            }, 1000);
        }
        
        // Update round
        if (data.currentRound !== undefined) {
            emojiRoundElement.textContent = `${data.currentRound}/5`;
        }
    }
    
    // Update Flappy Bird game state
    function updateFlappyBirdGameState(data) {
        flappyGameRunning = data.gameActive;
        flappyStatusElement.textContent = data.gameActive ? 'Playing' : 'Waiting';
        flappyActivePlayersElement.textContent = data.activePlayers;
        
        if (data.highScore !== undefined) {
            flappyHighscore = data.highScore;
            flappyHighscoreElement.textContent = flappyHighscore;
        }
    }
    
    // Update Emoji Race game state
    function updateEmojiRaceGameState(data) {
        raceGameRunning = data.gameActive;
        raceStatusElement.textContent = data.gameActive ? 'Racing!' : 'Waiting';
        trackLengthElement.textContent = `${data.trackLength}m`;
        raceSpeedElement.textContent = data.speed;
        
        if (data.winner) {
            raceWinnerElement.textContent = data.winner;
        }
    }
    
    // Handle Word Chain turn update
    function handleWordChainTurnUpdate(data) {
        wordchainCurrentPlayerElement.textContent = data.currentPlayer;
        isMyTurnWordchain = data.currentPlayerId === playerId;
        
        if (isMyTurnWordchain) {
            wordInput.disabled = false;
            wordInput.placeholder = "Your turn! Type a word...";
            wordInput.focus();
            submitWordBtn.disabled = false;
            addChatMessage('System', "It's your turn! Submit a word.", true);
        } else {
            wordInput.disabled = true;
            wordInput.placeholder = `Waiting for ${data.currentPlayer}...`;
            submitWordBtn.disabled = true;
        }
        
        // Reset and start timer
        if (timerInterval) {
            clearInterval(timerInterval);
        }
        
        wordchainTimeLeft = 30;
        updateWordChainTimerDisplay();
        
        timerInterval = setInterval(() => {
            wordchainTimeLeft--;
            updateWordChainTimerDisplay();
            
            if (wordchainTimeLeft <= 0) {
                clearInterval(timerInterval);
            }
        }, 1000);
    }
    
    // Handle Emoji Match turn update
    function handleEmojiMatchTurnUpdate(data) {
        emojimatchCurrentPlayerElement.textContent = data.currentPlayer;
        isMyTurnEmoji = data.currentPlayerId === playerId;
        
        if (isMyTurnEmoji) {
            emojiGuessInput.disabled = false;
            emojiGuessInput.placeholder = "Your turn! Guess the phrase...";
            emojiGuessInput.focus();
            submitGuessBtn.disabled = false;
            addChatMessage('System', "It's your turn! Guess the emoji puzzle.", true);
        } else {
            emojiGuessInput.disabled = true;
            emojiGuessInput.placeholder = `Waiting for ${data.currentPlayer}...`;
            submitGuessBtn.disabled = true;
        }
        
        // Reset and start timer
        if (timerInterval) {
            clearInterval(timerInterval);
        }
        
        emojimatchTimeLeft = 60;
        updateEmojiMatchTimerDisplay();
        
        timerInterval = setInterval(() => {
            emojimatchTimeLeft--;
            updateEmojiMatchTimerDisplay();
            
            if (emojimatchTimeLeft <= 0) {
                clearInterval(timerInterval);
            }
        }, 1000);
    }
    
    // Handle word submitted
    function handleWordSubmitted(data) {
        // Add word to chain
        const wordElement = document.createElement('div');
        wordElement.className = 'word-chain-item';
        wordElement.textContent = data.word;
        wordChainElement.appendChild(wordElement);
        
        // Update last letter
        lastLetterElement.textContent = data.lastLetter.toUpperCase();
        
        // Add to used words
        usedWords.add(data.word.toLowerCase());
        
        // Update player scores
        updateWordChainPlayerList(data.players);
        
        // Update my score
        const myPlayer = data.players.find(p => p.id === playerId);
        if (myPlayer) {
            wordchainPlayerScoreElement.textContent = myPlayer.score;
        }
        
        // Scroll word chain to show new word
        wordChainElement.scrollLeft = wordChainElement.scrollWidth;
        
        // Add chat message
        addChatMessage('System', `${data.playerName} added: ${data.word}`, true, 'new-word');
    }
    
    // Handle guess submitted
    function handleGuessSubmitted(data) {
        // Add guess to list
        const guessElement = document.createElement('div');
        guessElement.className = `guess-item ${data.isCorrect ? 'correct' : 'incorrect'}`;
        guessElement.innerHTML = `
            <span class="guess-player">${data.playerName}:</span>
            <span class="guess-text">${data.guess}</span>
            ${data.isCorrect ? '<span class="guess-result">✓ Correct!</span>' : ''}
        `;
        
        emojiGuessesElement.appendChild(guessElement);
        
        // Update player scores
        updateEmojiMatchPlayerList(data.players);
        
        // Update my score
        const myPlayer = data.players.find(p => p.id === playerId);
        if (myPlayer) {
            emojimatchPlayerScoreElement.textContent = myPlayer.score;
        }
        
        // Scroll guesses to show new guess
        emojiGuessesElement.scrollTop = emojiGuessesElement.scrollHeight;
        
        // Add chat message
        if (data.isCorrect) {
            addChatMessage('System', `${data.playerName} guessed correctly: "${data.guess}"`, true, 'correct-guess');
        }
    }
    
    // Update emoji puzzle
    function updateEmojiPuzzle(data) {
        currentEmojiPuzzle = data;
        
        // Clear existing emojis
        emojiPuzzleElement.innerHTML = '';
        
        // Add new emojis
        data.emojis.forEach(emoji => {
            const emojiElement = document.createElement('div');
            emojiElement.className = 'emoji';
            emojiElement.textContent = emoji;
            emojiPuzzleElement.appendChild(emojiElement);
        });
        
        // Update category
        emojiCategoryElement.textContent = data.category;
        
        // Clear guesses
        emojiGuessesElement.innerHTML = '';
    }
    
    // Update emoji round
    function updateEmojiRound(data) {
        emojiRoundElement.textContent = `${data.currentRound}/5`;
    }
    
    // Update Flappy Bird game
    function updateFlappyBirdGame(data) {
        flappyPlayers = data.players;
        flappyScore = data.score;
        flappyPipes = data.pipes || [];
        drawFlappyBirdGame();
    }
    
    // Update Emoji Race game
    function updateEmojiRaceGame(data) {
        racePlayers = data.players;
        drawEmojiRaceGame();
    }
    
    // Handle Flappy Bird game over
    function handleFlappyBirdGameOver(data) {
        flappyGameRunning = false;
        flappyStatusElement.textContent = 'Game Over';
        
        if (data.winner === playerId) {
            addChatMessage('System', '🎉 You won the Flappy Bird game!', true, 'flappy-score');
        } else {
            addChatMessage('System', `🏆 ${data.winnerName} won the Flappy Bird game with score ${data.winningScore}!`, true, 'flappy-score');
        }
        
        if (data.highScore > flappyHighscore) {
            flappyHighscore = data.highScore;
            flappyHighscoreElement.textContent = flappyHighscore;
        }
    }
    
    // Handle Emoji Race game over
    function handleEmojiRaceGameOver(data) {
        raceGameRunning = false;
        raceStatusElement.textContent = 'Race Over';
        raceWinnerElement.textContent = data.winnerName;
        
        if (data.winner === playerId) {
            addChatMessage('System', '🏁 You won the Emoji Race!', true, 'race-win');
        } else {
            addChatMessage('System', `🏁 ${data.winnerName} won the Emoji Race!`, true, 'race-win');
        }
    }
    
    // Handle game over (generic)
    function handleGameOver(data) {
        addChatMessage('System', `Game over! ${data.winner} wins with ${data.winningScore} points!`, true);
    }
    
    // Handle player joined
    function handlePlayerJoined(data) {
        if (currentGame === 'word-chain') {
            wordchainPlayerCountElement.textContent = `${data.playerCount} player${data.playerCount !== 1 ? 's' : ''}`;
            updateWordChainPlayerList(data.players);
        } else if (currentGame === 'emoji-match') {
            emojimatchPlayerCountElement.textContent = `${data.playerCount} player${data.playerCount !== 1 ? 's' : ''}`;
            updateEmojiMatchPlayerList(data.players);
        } else if (currentGame === 'flappy-bird') {
            flappybirdPlayerCountElement.textContent = `${data.playerCount} player${data.playerCount !== 1 ? 's' : ''}`;
            updateFlappyBirdPlayerList(data.players);
        } else if (currentGame === 'emoji-race') {
            emojiracePlayerCountElement.textContent = `${data.playerCount} player${data.playerCount !== 1 ? 's' : ''}`;
            updateEmojiRacePlayerList(data.players);
        }
        
        addChatMessage('System', `${data.playerName} joined the room`, true);
    }
    
    // Handle player left
    function handlePlayerLeft(data) {
        if (currentGame === 'word-chain') {
            wordchainPlayerCountElement.textContent = `${data.playerCount} player${data.playerCount !== 1 ? 's' : ''}`;
            updateWordChainPlayerList(data.players);
        } else if (currentGame === 'emoji-match') {
            emojimatchPlayerCountElement.textContent = `${data.playerCount} player${data.playerCount !== 1 ? 's' : ''}`;
            updateEmojiMatchPlayerList(data.players);
        } else if (currentGame === 'flappy-bird') {
            flappybirdPlayerCountElement.textContent = `${data.playerCount} player${data.playerCount !== 1 ? 's' : ''}`;
            updateFlappyBirdPlayerList(data.players);
        } else if (currentGame === 'emoji-race') {
            emojiracePlayerCountElement.textContent = `${data.playerCount} player${data.playerCount !== 1 ? 's' : ''}`;
            updateEmojiRacePlayerList(data.players);
        }
        
        addChatMessage('System', `${data.playerName} left the room`, true);
    }
    
    // Draw Flappy Bird game
    function drawFlappyBirdGame() {
        if (!flappyCtx) return;
        
        const canvas = flappyCanvas;
        const ctx = flappyCtx;
        
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Draw sky
        ctx.fillStyle = '#87CEEB';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw ground
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(0, canvas.height - 50, canvas.width, 50);
        
        // Draw grass
        ctx.fillStyle = '#7CFC00';
        ctx.fillRect(0, canvas.height - 50, canvas.width, 10);
        
        // Draw pipes
        flappyPipes.forEach(pipe => {
            // Top pipe
            ctx.fillStyle = '#228B22';
            ctx.fillRect(pipe.x, 0, 60, pipe.topHeight);
            
            // Bottom pipe
            ctx.fillRect(pipe.x, canvas.height - pipe.bottomHeight, 60, pipe.bottomHeight);
            
            // Pipe edges
            ctx.fillStyle = '#006400';
            ctx.fillRect(pipe.x - 5, pipe.topHeight - 20, 70, 20);
            ctx.fillRect(pipe.x - 5, canvas.height - pipe.bottomHeight, 70, 20);
        });
        
        // Draw birds
        Object.values(flappyPlayers).forEach(player => {
            if (!player.alive) return;
            
            // Draw bird
            ctx.save();
            ctx.translate(player.x, player.y);
            
            // Bird body
            ctx.fillStyle = player.color || '#FFD700';
            ctx.beginPath();
            ctx.ellipse(0, 0, 20, 15, 0, 0, Math.PI * 2);
            ctx.fill();
            
            // Bird wing
            ctx.fillStyle = '#FFA500';
            ctx.beginPath();
            ctx.ellipse(-10, 0, 10, 8, Math.PI/4, 0, Math.PI * 2);
            ctx.fill();
            
            // Bird eye
            ctx.fillStyle = 'black';
            ctx.beginPath();
            ctx.arc(10, -5, 3, 0, Math.PI * 2);
            ctx.fill();
            
            // Bird beak
            ctx.fillStyle = '#FF4500';
            ctx.beginPath();
            ctx.moveTo(20, 0);
            ctx.lineTo(30, 0);
            ctx.lineTo(20, 5);
            ctx.fill();
            
            ctx.restore();
            
            // Draw player name
            ctx.fillStyle = '#333';
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(player.name, player.x, player.y - 30);
            
            // Draw score
            ctx.fillStyle = '#4a00e0';
            ctx.font = 'bold 14px Arial';
            ctx.fillText(`Score: ${player.score}`, player.x, player.y - 45);
        });
        
        // Draw score
        ctx.fillStyle = '#333';
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(`Score: ${flappyScore}`, 20, 40);
        ctx.fillText(`High Score: ${flappyHighscore}`, 20, 70);
    }
    
    // Draw Emoji Race game
    function drawEmojiRaceGame() {
        raceTrackElement.innerHTML = '';
        
        // Create lanes for each player
        const playerIds = Object.keys(racePlayers);
        const laneHeight = 80;
        
        playerIds.forEach((playerId, index) => {
            const player = racePlayers[playerId];
            const lane = document.createElement('div');
            lane.className = 'race-lane';
            lane.style.height = `${laneHeight}px`;
            
            // Create racer emoji
            const racer = document.createElement('div');
            racer.className = 'emoji-racer';
            racer.textContent = player.emoji || '🚗';
            racer.style.left = `${50 + (player.position || 0)}px`;
            racer.style.top = `${index * laneHeight + 20}px`;
            
            // Create player info
            const info = document.createElement('div');
            info.className = 'racer-info';
            info.textContent = `${player.name} (${Math.round(player.speed || 0)}m/s)`;
            info.style.top = `${index * laneHeight + 30}px`;
            
            lane.appendChild(racer);
            lane.appendChild(info);
            raceTrackElement.appendChild(lane);
        });
        
        // Add finish line
        const finishLine = document.createElement('div');
        finishLine.className = 'finish-line';
        raceTrackElement.appendChild(finishLine);
    }
    
    // Update Word Chain player list
    function updateWordChainPlayerList(players) {
        wordchainPlayersListElement.innerHTML = '';
        
        players.forEach(player => {
            const playerElement = document.createElement('div');
            playerElement.className = `player-item ${player.id === playerId ? 'active' : ''}`;
            
            playerElement.innerHTML = `
                <div class="player-info">
                    <span class="player-name">${player.name} ${player.id === playerId ? '(You)' : ''}</span>
                    <div class="player-status">${player.isCurrentPlayer ? '⏳ Current turn' : 'Waiting'}</div>
                </div>
                <div class="player-score">${player.score}</div>
            `;
            
            wordchainPlayersListElement.appendChild(playerElement);
        });
    }
    
    // Update Emoji Match player list
    function updateEmojiMatchPlayerList(players) {
        emojimatchPlayersListElement.innerHTML = '';
        
        players.forEach(player => {
            const playerElement = document.createElement('div');
            playerElement.className = `player-item ${player.id === playerId ? 'active' : ''}`;
            
            playerElement.innerHTML = `
                <div class="player-info">
                    <span class="player-name">${player.name} ${player.id === playerId ? '(You)' : ''}</span>
                    <div class="player-status">${player.isCurrentPlayer ? '⏳ Current turn' : 'Waiting'}</div>
                </div>
                <div class="player-score">${player.score}</div>
            `;
            
            emojimatchPlayersListElement.appendChild(playerElement);
        });
    }
    
    // Update Flappy Bird player list
    function updateFlappyBirdPlayerList(players) {
        flappybirdPlayersListElement.innerHTML = '';
        
        players.forEach(player => {
            const playerElement = document.createElement('div');
            playerElement.className = `player-item ${player.id === playerId ? 'active' : ''}`;
            
            playerElement.innerHTML = `
                <div class="player-info">
                    <span class="player-name">${player.name} ${player.id === playerId ? '(You)' : ''}</span>
                    <div class="player-status">${player.alive ? '🕊️ Flying' : '💀 Dead'}</div>
                </div>
                <div class="player-score">${player.score || 0}</div>
            `;
            
            flappybirdPlayersListElement.appendChild(playerElement);
        });
    }
    
    // Update Emoji Race player list
    function updateEmojiRacePlayerList(players) {
        emojiracePlayersListElement.innerHTML = '';
        
        players.forEach((player, index) => {
            const playerElement = document.createElement('div');
            playerElement.className = `player-item ${player.id === playerId ? 'active' : ''}`;
            
            // Assign key to player
            const key = raceKeys[(index + 1).toString()] || '?';
            
            playerElement.innerHTML = `
                <div class="player-info">
                    <span class="player-name">${player.name} ${player.id === playerId ? '(You)' : ''}</span>
                    <div class="player-status">Key: <kbd>${key}</kbd></div>
                </div>
                <div class="player-score">${Math.floor((player.position || 0) / 10)}m</div>
            `;
            
            emojiracePlayersListElement.appendChild(playerElement);
        });
    }
    
    // Update emoji guesses
    function updateEmojiGuesses(guesses) {
        emojiGuessesElement.innerHTML = '';
        
        guesses.forEach(guess => {
            const guessElement = document.createElement('div');
            guessElement.className = `guess-item ${guess.isCorrect ? 'correct' : 'incorrect'}`;
            guessElement.innerHTML = `
                <span class="guess-player">${guess.playerName}:</span>
                <span class="guess-text">${guess.guess}</span>
                ${guess.isCorrect ? '<span class="guess-result">✓ Correct!</span>' : ''}
            `;
            
            emojiGuessesElement.appendChild(guessElement);
        });
        
        // Scroll to bottom
        emojiGuessesElement.scrollTop = emojiGuessesElement.scrollHeight;
    }
    
    // Update word chain
    function updateWordChain(wordChain) {
        wordChainElement.innerHTML = '<div class="word-chain-start">START →</div>';
        
        wordChain.forEach(item => {
            const wordElement = document.createElement('div');
            wordElement.className = 'word-chain-item';
            wordElement.textContent = item.word;
            wordElement.title = `Added by ${item.player}`;
            wordChainElement.appendChild(wordElement);
        });
    }
    
    // Update Word Chain timer
    function updateWordChainTimer(data) {
        wordchainTimeLeft = data.timeLeft;
        updateWordChainTimerDisplay();
    }
    
    // Update Emoji Match timer
    function updateEmojiMatchTimer(data) {
        emojimatchTimeLeft = data.timeLeft;
        updateEmojiMatchTimerDisplay();
    }
    
    // Update Word Chain timer display
    function updateWordChainTimerDisplay() {
        wordchainTimerElement.textContent = `${wordchainTimeLeft}s`;
        
        if (wordchainTimeLeft <= 10) {
            wordchainTimerElement.style.color = '#ff416c';
        } else if (wordchainTimeLeft <= 20) {
            wordchainTimerElement.style.color = '#ffa500';
        } else {
            wordchainTimerElement.style.color = '#4a00e0';
        }
    }
    
    // Update Emoji Match timer display
    function updateEmojiMatchTimerDisplay() {
        emojimatchTimerElement.textContent = `${emojimatchTimeLeft}s`;
        
        if (emojimatchTimeLeft <= 10) {
            emojimatchTimerElement.style.color = '#ff416c';
        } else if (emojimatchTimeLeft <= 30) {
            emojimatchTimerElement.style.color = '#ffa500';
        } else {
            emojimatchTimerElement.style.color = '#4a00e0';
        }
    }
    
    // Add chat message
    function addChatMessage(sender, message, isSystem = false, type = '') {
        const messageElement = document.createElement('div');
        messageElement.className = `message ${isSystem ? 'system' : ''} ${type}`;
        
        const now = new Date();
        const timeString = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
        
        messageElement.innerHTML = `
            <span class="time">${timeString}</span>
            <span class="sender">${sender}:</span>
            <span class="text">${message}</span>
        `;
        
        chatMessagesElement.appendChild(messageElement);
        
        // Scroll to bottom
        chatMessagesElement.scrollTop = chatMessagesElement.scrollHeight;
    }
    
    // Update connection status
    function updateStatus(message, type) {
        statusElement.textContent = message;
        
        statusElement.className = '';
        if (type === 'success') {
            statusElement.classList.add('success');
        } else if (type === 'error') {
            statusElement.classList.add('error');
        }
    }
    
    // Show game screen
    function showGameScreen(gameType) {
        connectionSection.classList.remove('active');
        connectionSection.classList.add('hidden');
        
        document.querySelectorAll('.game-section').forEach(section => {
            section.classList.remove('active');
            section.classList.add('hidden');
        });
        
        if (gameType === 'word-chain') {
            wordchainSection.classList.remove('hidden');
            wordchainSection.classList.add('active');
        } else if (gameType === 'emoji-match') {
            emojimatchSection.classList.remove('hidden');
            emojimatchSection.classList.add('active');
        } else if (gameType === 'flappy-bird') {
            flappybirdSection.classList.remove('hidden');
            flappybirdSection.classList.add('active');
        } else if (gameType === 'emoji-race') {
            emojiraceSection.classList.remove('hidden');
            emojiraceSection.classList.add('active');
        }
    }
    
    // Show connection screen
    function showConnectionScreen() {
        connectionSection.classList.remove('hidden');
        connectionSection.classList.add('active');
        
        document.querySelectorAll('.game-section').forEach(section => {
            section.classList.remove('active');
            section.classList.add('hidden');
        });
        
        chatSection.classList.add('hidden');
        startGameModal.classList.add('hidden');
    }
    
    // Flappy Bird game loop
    function flappyGameLoop() {
        if (flappyCtx) {
            drawFlappyBirdGame();
        }
        requestAnimationFrame(flappyGameLoop);
    }
    
    // Reset game state
    function resetGame() {
        currentRoom = null;
        currentGame = null;
        isHost = false;
        
        // Word Chain
        isMyTurnWordchain = false;
        wordchainTimeLeft = 30;
        usedWords.clear();
        
        // Emoji Match
        isMyTurnEmoji = false;
        emojimatchTimeLeft = 60;
        currentEmojiPuzzle = null;
        
        // Flappy Bird
        flappyGameRunning = false;
        flappyScore = 0;
        flappyPlayers = {};
        flappyPipes = [];
        
        // Emoji Race
        raceGameRunning = false;
        racePlayers = {};
        keyPressCount = 0;
        
        // Clear timers
        if (timerInterval) {
            clearInterval(timerInterval);
            timerInterval = null;
        }
        
        // Reset UI elements
        wordchainRoomElement.textContent = '---';
        wordchainPlayerCountElement.textContent = '1 player';
        wordchainCurrentPlayerElement.textContent = 'Waiting...';
        wordchainPlayerScoreElement.textContent = '0';
        wordchainTimerElement.textContent = '30s';
        lastLetterElement.textContent = '-';
        wordInput.value = '';
        wordInput.disabled = false;
        submitWordBtn.disabled = false;
        
        emojimatchRoomElement.textContent = '---';
        emojimatchPlayerCountElement.textContent = '1 player';
        emojimatchCurrentPlayerElement.textContent = 'Waiting...';
        emojimatchPlayerScoreElement.textContent = '0';
        emojimatchTimerElement.textContent = '60s';
        emojiRoundElement.textContent = '1/5';
        emojiGuessInput.value = '';
        emojiGuessInput.disabled = false;
        submitGuessBtn.disabled = false;
        emojiCategoryElement.textContent = 'Movies';
        
        flappybirdRoomElement.textContent = '---';
        flappybirdPlayerCountElement.textContent = '1 player';
        flappyHighscoreElement.textContent = '0';
        flappyStatusElement.textContent = 'Waiting...';
        flappyActivePlayersElement.textContent = '1';
        
        emojiraceRoomElement.textContent = '---';
        emojiracePlayerCountElement.textContent = '1 player';
        raceStatusElement.textContent = 'Waiting...';
        trackLengthElement.textContent = '100m';
        raceSpeedElement.textContent = 'Normal';
        raceWinnerElement.textContent = 'None';
        
        // Clear player lists
        wordchainPlayersListElement.innerHTML = '';
        emojimatchPlayersListElement.innerHTML = '';
        flappybirdPlayersListElement.innerHTML = '';
        emojiracePlayersListElement.innerHTML = '';
        
        // Clear word chain
        wordChainElement.innerHTML = '<div class="word-chain-start">START →</div>';
        
        // Clear emoji puzzle
        emojiPuzzleElement.innerHTML = '';
        
        // Clear guesses
        emojiGuessesElement.innerHTML = '';
        
        // Clear race track
        raceTrackElement.innerHTML = '';
        
        // Clear chat (keep first message)
        const firstMessage = chatMessagesElement.querySelector('.message');
        chatMessagesElement.innerHTML = '';
        if (firstMessage) {
            chatMessagesElement.appendChild(firstMessage);
        }
    }
    
    // Initialize the game
    init();
});
