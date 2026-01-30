// Game client for Word Chain Challenge
document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const connectionSection = document.getElementById('connection-section');
    const gameSection = document.getElementById('game-section');
    const usernameInput = document.getElementById('username');
    const roomCodeInput = document.getElementById('room-code');
    const joinRoomBtn = document.getElementById('join-room');
    const createRoomBtn = document.getElementById('create-room');
    const leaveRoomBtn = document.getElementById('leave-room');
    const statusElement = document.getElementById('status');
    const currentRoomElement = document.getElementById('current-room');
    const playerCountElement = document.getElementById('player-count');
    const playersListElement = document.getElementById('players-list');
    const wordChainElement = document.getElementById('word-chain');
    const currentPlayerElement = document.getElementById('current-player');
    const timerElement = document.getElementById('timer');
    const playerScoreElement = document.getElementById('player-score');
    const wordInput = document.getElementById('word-input');
    const submitWordBtn = document.getElementById('submit-word');
    const lastLetterElement = document.getElementById('last-letter');
    const chatMessagesElement = document.getElementById('chat-messages');
    const chatInput = document.getElementById('chat-input');
    const sendChatBtn = document.getElementById('send-chat');
    const gameLinkElement = document.getElementById('game-link');
    const mobileNotification = document.getElementById('mobile-notification');

    // Game state
    let socket = null;
    let playerId = null;
    let currentRoom = null;
    let isMyTurn = false;
    let timerInterval = null;
    let timeLeft = 30;
    let usedWords = new Set();
    
    // Check if mobile device
    function isMobileDevice() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }
    
    // Show mobile notification if on mobile
    if (isMobileDevice()) {
        setTimeout(() => {
            mobileNotification.classList.remove('hidden');
            setTimeout(() => {
                mobileNotification.classList.add('hidden');
            }, 5000);
        }, 3000);
    }

    // Initialize game
    function init() {
        // Update game link
        gameLinkElement.textContent = window.location.href;
        
        // Event listeners
        joinRoomBtn.addEventListener('click', joinRoom);
        createRoomBtn.addEventListener('click', createRoom);
        leaveRoomBtn.addEventListener('click', leaveRoom);
        submitWordBtn.addEventListener('click', submitWord);
        sendChatBtn.addEventListener('click', sendChatMessage);
        
        // Enter key handlers
        wordInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') submitWord();
        });
        
        chatInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') sendChatMessage();
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
        // For local development, connect to local server
        // For deployment, this will connect to Render URL automatically
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
        
        socket.on('game-state', (data) => {
            updateGameState(data);
        });
        
        socket.on('turn-update', (data) => {
            handleTurnUpdate(data);
        });
        
        socket.on('word-submitted', (data) => {
            handleWordSubmitted(data);
        });
        
        socket.on('timer-update', (data) => {
            updateTimer(data);
        });
        
        socket.on('chat-message', (data) => {
            addChatMessage(data.sender, data.message, data.isSystem);
        });
        
        socket.on('game-over', (data) => {
            handleGameOver(data);
        });
    }
    
    // Join existing room
    function joinRoom() {
        const username = usernameInput.value.trim();
        const roomCode = roomCodeInput.value.trim().toUpperCase();
        
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
            
            // Wait a moment for connection to establish
            setTimeout(() => {
                socket.emit('join-room', { username, roomCode });
            }, 500);
        } else {
            socket.emit('join-room', { username, roomCode });
        }
    }
    
    // Create new room
    function createRoom() {
        const username = usernameInput.value.trim();
        const roomCode = generateRoomCode();
        
        if (!username) {
            alert('Please enter your name');
            return;
        }
        
        roomCodeInput.value = roomCode;
        
        if (!socket || !socket.connected) {
            connectToServer();
            
            // Wait a moment for connection to establish
            setTimeout(() => {
                socket.emit('join-room', { username, roomCode });
            }, 500);
        } else {
            socket.emit('join-room', { username, roomCode });
        }
    }
    
    // Leave room
    function leaveRoom() {
        if (socket && socket.connected) {
            socket.emit('leave-room');
            resetGame();
            showConnectionScreen();
        }
    }
    
    // Submit a word
    function submitWord() {
        if (!isMyTurn) {
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
        updateStatus(`Joined room: ${data.roomCode}`, 'success');
        
        // Update UI
        currentRoomElement.textContent = data.roomCode;
        playerCountElement.textContent = `${data.players.length} player${data.players.length !== 1 ? 's' : ''}`;
        
        // Update player list
        updatePlayerList(data.players);
        
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
            updateGameState(data.gameState);
        }
        
        // Show game screen
        showGameScreen();
        
        // Add system message
        addChatMessage('System', `Welcome to room ${data.roomCode}! Share this code with friends: ${data.roomCode}`, true);
    }
    
    // Handle player joined
    function handlePlayerJoined(data) {
        playerCountElement.textContent = `${data.playerCount} player${data.playerCount !== 1 ? 's' : ''}`;
        updatePlayerList(data.players);
        addChatMessage('System', `${data.playerName} joined the room`, true);
    }
    
    // Handle player left
    function handlePlayerLeft(data) {
        playerCountElement.textContent = `${data.playerCount} player${data.playerCount !== 1 ? 's' : ''}`;
        updatePlayerList(data.players);
        addChatMessage('System', `${data.playerName} left the room`, true);
    }
    
    // Update game state
    function updateGameState(data) {
        // Update current player
        currentPlayerElement.textContent = data.currentPlayer;
        
        // Check if it's my turn
        isMyTurn = data.currentPlayerId === playerId;
        
        // Update input field
        if (isMyTurn) {
            wordInput.disabled = false;
            wordInput.placeholder = "Your turn! Type a word...";
            wordInput.focus();
            submitWordBtn.disabled = false;
            
            // Add visual indication
            currentPlayerElement.classList.add('highlight');
        } else {
            wordInput.disabled = true;
            wordInput.placeholder = `Waiting for ${data.currentPlayer}...`;
            submitWordBtn.disabled = true;
            currentPlayerElement.classList.remove('highlight');
        }
        
        // Update timer
        if (timerInterval) {
            clearInterval(timerInterval);
        }
        
        timeLeft = data.timeLeft;
        updateTimerDisplay();
        
        if (data.gameActive) {
            timerInterval = setInterval(() => {
                timeLeft--;
                updateTimerDisplay();
                
                if (timeLeft <= 0) {
                    clearInterval(timerInterval);
                }
            }, 1000);
        }
    }
    
    // Handle turn update
    function handleTurnUpdate(data) {
        currentPlayerElement.textContent = data.currentPlayer;
        isMyTurn = data.currentPlayerId === playerId;
        
        if (isMyTurn) {
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
        
        timeLeft = 30;
        updateTimerDisplay();
        
        timerInterval = setInterval(() => {
            timeLeft--;
            updateTimerDisplay();
            
            if (timeLeft <= 0) {
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
        updatePlayerList(data.players);
        
        // Update my score
        const myPlayer = data.players.find(p => p.id === playerId);
        if (myPlayer) {
            playerScoreElement.textContent = myPlayer.score;
        }
        
        // Scroll word chain to show new word
        wordChainElement.scrollLeft = wordChainElement.scrollWidth;
        
        // Add chat message
        addChatMessage('System', `${data.playerName} added: ${data.word}`, true);
    }
    
    // Update timer
    function updateTimer(data) {
        timeLeft = data.timeLeft;
        updateTimerDisplay();
    }
    
    // Update timer display
    function updateTimerDisplay() {
        timerElement.textContent = `${timeLeft}s`;
        
        // Change color when time is running out
        if (timeLeft <= 10) {
            timerElement.style.color = '#ff416c';
        } else if (timeLeft <= 20) {
            timerElement.style.color = '#ffa500';
        } else {
            timerElement.style.color = '#4a00e0';
        }
    }
    
    // Handle game over
    function handleGameOver(data) {
        addChatMessage('System', `Game over! ${data.winner} wins with ${data.winningScore} points!`, true);
        
        // Reset timer
        if (timerInterval) {
            clearInterval(timerInterval);
        }
        
        timerElement.textContent = "Game Over";
        
        // Disable input
        wordInput.disabled = true;
        wordInput.placeholder = "Game Over";
        submitWordBtn.disabled = true;
    }
    
    // Update player list
    function updatePlayerList(players) {
        playersListElement.innerHTML = '';
        
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
            
            playersListElement.appendChild(playerElement);
        });
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
    function addChatMessage(sender, message, isSystem = false) {
        const messageElement = document.createElement('div');
        messageElement.className = `message ${isSystem ? 'system' : ''}`;
        
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
        
        // Reset classes
        statusElement.className = '';
        
        // Add type class
        if (type === 'success') {
            statusElement.classList.add('success');
        } else if (type === 'error') {
            statusElement.classList.add('error');
        }
    }
    
    // Show game screen
    function showGameScreen() {
        connectionSection.classList.remove('active');
        connectionSection.classList.add('hidden');
        
        gameSection.classList.remove('hidden');
        gameSection.classList.add('active');
    }
    
    // Show connection screen
    function showConnectionScreen() {
        connectionSection.classList.remove('hidden');
        connectionSection.classList.add('active');
        
        gameSection.classList.remove('active');
        gameSection.classList.add('hidden');
    }
    
    // Reset game state
    function resetGame() {
        currentRoom = null;
        isMyTurn = false;
        
        if (timerInterval) {
            clearInterval(timerInterval);
        }
        
        timeLeft = 30;
        usedWords.clear();
        
        // Reset UI elements
        currentRoomElement.textContent = '---';
        playerCountElement.textContent = '1 player';
        currentPlayerElement.textContent = 'Waiting...';
        playerScoreElement.textContent = '0';
        timerElement.textContent = '30s';
        lastLetterElement.textContent = '-';
        wordInput.value = '';
        wordInput.disabled = false;
        submitWordBtn.disabled = false;
        
        // Clear players list
        playersListElement.innerHTML = '';
        
        // Clear word chain
        wordChainElement.innerHTML = '<div class="word-chain-start">START →</div>';
        
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