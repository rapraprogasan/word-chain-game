// Enhanced client for both Word Chain and Emoji Match games
document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const connectionSection = document.getElementById('connection-section');
    const wordchainSection = document.getElementById('wordchain-section');
    const emojimatchSection = document.getElementById('emojimatch-section');
    const chatSection = document.getElementById('chat-section');
    
    // Connection elements
    const usernameInput = document.getElementById('username');
    const roomCodeInput = document.getElementById('room-code');
    const joinRoomBtn = document.getElementById('join-room');
    const createRoomBtn = document.getElementById('create-room');
    const statusElement = document.getElementById('status');
    
    // Game selection
    const gameOptions = document.querySelectorAll('.game-option');
    const selectedGame = { type: 'word-chain' }; // Default game
    
    // Word Chain elements
    const leaveWordchainBtn = document.getElementById('leave-wordchain');
    const switchToEmojiBtn = document.getElementById('switch-to-emoji');
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
    const switchToWordchainBtn = document.getElementById('switch-to-wordchain');
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
    
    // Chat elements (shared)
    const chatMessagesElement = document.getElementById('chat-messages');
    const chatInput = document.getElementById('chat-input');
    const sendChatBtn = document.getElementById('send-chat');
    
    // Modal elements
    const startGameModal = document.getElementById('start-game-modal');
    const startGameBtn = document.getElementById('start-game-btn');
    const waitPlayersBtn = document.getElementById('wait-players-btn');
    
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
    
    // Initialize game
    function init() {
        // Update game link
        const gameLinkElement = document.getElementById('game-link');
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
        leaveWordchainBtn.addEventListener('click', leaveRoom);
        leaveEmojimatchBtn.addEventListener('click', leaveRoom);
        switchToEmojiBtn.addEventListener('click', () => switchGame('emoji-match'));
        switchToWordchainBtn.addEventListener('click', () => switchGame('word-chain'));
        
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
        
        // 4 letters
        for (let i = 0; i < 4; i++) {
            code += letters.charAt(Math.floor(Math.random() * letters.length));
        }
        
        // 3 numbers
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
                // Show start game modal if host and at least 2 players
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
    
    // Switch between games
    function switchGame(gameType) {
        if (!socket || !socket.connected || !currentRoom) {
            alert('You must be in a room to switch games');
            return;
        }
        
        socket.emit('switch-game', { gameType });
        selectedGame.type = gameType;
        
        // Update UI to show selected game
        gameOptions.forEach(opt => {
            opt.classList.toggle('active', opt.dataset.game === gameType);
        });
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
    
    // Submit a word (Word Chain)
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
    
    // Submit a guess (Emoji Match)
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
        }
        
        // Show chat section
        chatSection.classList.remove('hidden');
        
        // Add system message
        addChatMessage('System', `Welcome to ${data.gameType === 'word-chain' ? 'Word Chain' : 'Emoji Match'} in room ${data.roomCode}! Share code: ${data.roomCode}`, true);
    }
    
    // Show Word Chain game
    function showWordChainGame(data) {
        // Update UI
        wordchainRoomElement.textContent = data.roomCode;
        wordchainPlayerCountElement.textContent = `${data.players.length} player${data.players.length !== 1 ? 's' : ''}`;
        
        // Update player list
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
        
        // Show game screen
        showGameScreen('word-chain');
    }
    
    // Show Emoji Match game
    function showEmojiMatchGame(data) {
        // Update UI
        emojimatchRoomElement.textContent = data.roomCode;
        emojimatchPlayerCountElement.textContent = `${data.players.length} player${data.players.length !== 1 ? 's' : ''}`;
        
        // Update player list
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
        
        // Show game screen
        showGameScreen('emoji-match');
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
    
    // Handle player joined
    function handlePlayerJoined(data) {
        if (currentGame === 'word-chain') {
            wordchainPlayerCountElement.textContent = `${data.playerCount} player${data.playerCount !== 1 ? 's' : ''}`;
            updateWordChainPlayerList(data.players);
        } else {
            emojimatchPlayerCountElement.textContent = `${data.playerCount} player${data.playerCount !== 1 ? 's' : ''}`;
            updateEmojiMatchPlayerList(data.players);
        }
        
        addChatMessage('System', `${data.playerName} joined the room`, true);
    }
    
    // Handle player left
    function handlePlayerLeft(data) {
        if (currentGame === 'word-chain') {
            wordchainPlayerCountElement.textContent = `${data.playerCount} player${data.playerCount !== 1 ? 's' : ''}`;
            updateWordChainPlayerList(data.players);
        } else {
            emojimatchPlayerCountElement.textContent = `${data.playerCount} player${data.playerCount !== 1 ? 's' : ''}`;
            updateEmojiMatchPlayerList(data.players);
        }
        
        addChatMessage('System', `${data.playerName} left the room`, true);
    }
    
    // Handle game over
    function handleGameOver(data) {
        addChatMessage('System', `Game over! ${data.winner} wins with ${data.winningScore} points!`, true);
        
        // Reset timer
        if (timerInterval) {
            clearInterval(timerInterval);
        }
        
        if (currentGame === 'word-chain') {
            wordchainTimerElement.textContent = "Game Over";
            wordInput.disabled = true;
            wordInput.placeholder = "Game Over";
            submitWordBtn.disabled = true;
        } else {
            emojimatchTimerElement.textContent = "Game Over";
            emojiGuessInput.disabled = true;
            emojiGuessInput.placeholder = "Game Over";
            submitGuessBtn.disabled = true;
        }
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
        
        // Hide all game sections
        document.querySelectorAll('.game-section').forEach(section => {
            section.classList.remove('active');
            section.classList.add('hidden');
        });
        
        // Show selected game section
        if (gameType === 'word-chain') {
            wordchainSection.classList.remove('hidden');
            wordchainSection.classList.add('active');
        } else if (gameType === 'emoji-match') {
            emojimatchSection.classList.remove('hidden');
            emojimatchSection.classList.add('active');
        }
    }
    
    // Show connection screen
    function showConnectionScreen() {
        connectionSection.classList.remove('hidden');
        connectionSection.classList.add('active');
        
        // Hide all game sections
        document.querySelectorAll('.game-section').forEach(section => {
            section.classList.remove('active');
            section.classList.add('hidden');
        });
        
        // Hide chat section
        chatSection.classList.add('hidden');
        
        // Hide modal
        startGameModal.classList.add('hidden');
    }
    
    // Reset game state
    function resetGame() {
        currentRoom = null;
        currentGame = null;
        isHost = false;
        isMyTurnWordchain = false;
        isMyTurnEmoji = false;
        
        if (timerInterval) {
            clearInterval(timerInterval);
        }
        
        wordchainTimeLeft = 30;
        emojimatchTimeLeft = 60;
        usedWords.clear();
        currentEmojiPuzzle = null;
        
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
        
        // Clear player lists
        wordchainPlayersListElement.innerHTML = '';
        emojimatchPlayersListElement.innerHTML = '';
        
        // Clear word chain
        wordChainElement.innerHTML = '<div class="word-chain-start">START →</div>';
        
        // Clear emoji puzzle
        emojiPuzzleElement.innerHTML = '';
        
        // Clear guesses
        emojiGuessesElement.innerHTML = '';
        
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
