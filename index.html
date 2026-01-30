<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Word Chain Challenge - Group Game</title>
    <link rel="stylesheet" href="style.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet">
</head>
<body>
    <div class="container">
        <header>
            <h1><i class="fas fa-link"></i> Word Chain Challenge</h1>
            <p class="subtitle">A multiplayer game for your group chat!</p>
        </header>

        <main>
            <!-- Connection Section -->
            <section id="connection-section" class="card active">
                <h2><i class="fas fa-plug"></i> Connect to Game</h2>
                <div class="form-group">
                    <label for="username">Your Name:</label>
                    <input type="text" id="username" placeholder="Enter your name" maxlength="20" value="Player">
                </div>
                <div class="form-group">
                    <label for="room-code">Room Code:</label>
                    <input type="text" id="room-code" placeholder="Enter or create room code" maxlength="10" value="WORD123">
                    <small>Share this code with friends to play together</small>
                </div>
                <div class="button-group">
                    <button id="join-room" class="btn btn-primary">
                        <i class="fas fa-sign-in-alt"></i> Join Room
                    </button>
                    <button id="create-room" class="btn btn-secondary">
                        <i class="fas fa-plus-circle"></i> Create New Room
                    </button>
                </div>
                <div class="connection-status">
                    <p id="status">Disconnected. Click "Join Room" to start.</p>
                </div>
            </section>

            <!-- Game Section -->
            <section id="game-section" class="card hidden">
                <div class="game-header">
                    <h2>Game Room: <span id="current-room">---</span></h2>
                    <div class="room-info">
                        <span id="player-count">1 player</span>
                        <button id="leave-room" class="btn btn-small btn-danger">
                            <i class="fas fa-sign-out-alt"></i> Leave
                        </button>
                    </div>
                </div>

                <!-- Game Board -->
                <div class="game-board">
                    <div class="current-word-display">
                        <h3>Current Word Chain</h3>
                        <div id="word-chain" class="word-chain-container">
                            <div class="word-chain-start">START →</div>
                        </div>
                    </div>

                    <div class="game-info">
                        <div class="info-card">
                            <h4><i class="fas fa-user-clock"></i> Current Player</h4>
                            <p id="current-player">Waiting...</p>
                        </div>
                        <div class="info-card">
                            <h4><i class="fas fa-clock"></i> Time Left</h4>
                            <p id="timer">30s</p>
                        </div>
                        <div class="info-card">
                            <h4><i class="fas fa-trophy"></i> Score</h4>
                            <p id="player-score">0</p>
                        </div>
                    </div>

                    <!-- Player Input -->
                    <div class="input-section">
                        <h3>Your Turn: Add a Word</h3>
                        <p class="instruction">Word must start with the last letter of the previous word</p>
                        <div class="input-group">
                            <input type="text" id="word-input" placeholder="Type a word..." maxlength="20" disabled>
                            <button id="submit-word" class="btn btn-primary" disabled>
                                <i class="fas fa-paper-plane"></i> Submit
                            </button>
                        </div>
                        <div class="last-letter-hint">
                            Last letter: <span id="last-letter">-</span>
                        </div>
                    </div>

                    <!-- Player List -->
                    <div class="players-section">
                        <h3><i class="fas fa-users"></i> Players in Room</h3>
                        <div id="players-list" class="players-list">
                            <!-- Players will be added here dynamically -->
                        </div>
                    </div>

                    <!-- Chat Section -->
                    <div class="chat-section">
                        <h3><i class="fas fa-comments"></i> Game Chat</h3>
                        <div id="chat-messages" class="chat-messages">
                            <div class="message system">
                                <span class="time">Now</span>
                                <span class="sender">System</span>
                                <span class="text">Welcome to Word Chain Challenge! Share the room code with friends to play together.</span>
                            </div>
                        </div>
                        <div class="chat-input">
                            <input type="text" id="chat-input" placeholder="Type a message...">
                            <button id="send-chat" class="btn btn-small">
                                <i class="fas fa-paper-plane"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </section>
        </main>

        <footer>
            <p>Share this link with friends: <span id="game-link">Loading...</span></p>
            <p class="instructions">
                <strong>How to play:</strong> Each player adds a word that starts with the last letter of the previous word. 
                No repeating words! Earn points for each valid word.
            </p>
            <p class="copyright">Word Chain Challenge © 2023 | Works on mobile & desktop</p>
        </footer>
    </div>

    <!-- Mobile notification -->
    <div id="mobile-notification" class="mobile-notification hidden">
        <p>Game optimized for mobile! Rotate your device for the best experience.</p>
    </div>

    <script src="/socket.io/socket.io.js"></script>
    <script src="client.js"></script>
</body>
</html>