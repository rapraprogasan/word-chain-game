# Group Chat Games - Word Chain & Emoji Match

Two multiplayer games in one! Play Word Chain or Emoji Match with friends on both desktop and mobile devices.

## Features

### Word Chain Challenge
- Real-time word chaining gameplay
- Each word must start with the last letter of the previous word
- No repeating words allowed
- Score based on word length

### Emoji Match Challenge
- Guess phrases represented by emojis
- Multiple categories: Movies, Phrases, Songs, Food
- 5 rounds per game
- Score based on speed of correct answers

### Shared Features
- Real-time multiplayer gameplay
- Mobile-responsive design
- Game chat for communication
- Room-based system for private games
- Player score tracking
- Turn timer

## Deployment to Render

### Step 1: Prepare your files
1. Create a folder for your project
2. Copy all the provided files into the folder:
   - `index.html`
   - `style.css`
   - `client.js`
   - `server.js`
   - `package.json`
   - `README.md` (this file)

### Step 2: Create a Render account
1. Go to [render.com](https://render.com)
2. Sign up for a free account

### Step 3: Deploy to Render
1. In your Render dashboard, click "New +" and select "Web Service"
2. Connect your GitHub repository or use the manual deploy option
3. Configure your web service:
   - **Name**: `group-chat-games` (or any name you prefer)
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
   - **Plan**: Select the free plan

4. Click "Create Web Service"
5. Render will automatically build and deploy your application
6. Once deployed, you'll get a URL like `https://group-chat-games.onrender.com`

### Step 4: Share with friends
1. Share the Render URL with your friends
2. When they open it, they can:
   - Enter their name
   - Select a game (Word Chain or Emoji Match)
   - Join an existing room using a room code
   - Or create a new room and share the code with others

## Running Locally

1. Install Node.js (version 14 or higher)
2. Navigate to the project folder in terminal
3. Run `npm install`
4. Run `npm start` or `npm run dev` (with nodemon for auto-restart)
5. Open browser and go to `http://localhost:3000`

## How to Play Word Chain

1. **Objective**: Create the longest word chain by adding words that start with the last letter of the previous word
2. **Setup**: 
   - One player creates a room and shares the room code
   - Other players join using the same room code
3. **Gameplay**:
   - Players take turns adding valid words
   - Each word must start with the last letter of the previous word
   - Words cannot be repeated in the same game
   - Each player has 30 seconds per turn
4. **Scoring**: Players earn points equal to the length of the word they submit
5. **Winning**: The player with the highest score when the game ends wins

## How to Play Emoji Match

1. **Objective**: Guess the phrases represented by emoji puzzles
2. **Setup**: 
   - One player creates a room and shares the room code
   - Other players join using the same room code
3. **Gameplay**:
   - Players take turns guessing the phrase
   - 5 rounds total
   - Each player has 60 seconds per turn
4. **Scoring**: Players earn points based on how quickly they guess correctly (faster = more points)
5. **Winning**: The player with the highest score after 5 rounds wins

## Switching Games

The host can switch between Word Chain and Emoji Match at any time before a game starts:
1. Click "Switch to Word Chain" or "Switch to Emoji Match"
2. All players in the room will switch to the new game
3. Note: Game progress is not saved when switching

## Files Structure

- `index.html` - Main HTML structure for both games
- `style.css` - Styling for both games
- `client.js` - Frontend logic for both games
- `server.js` - Backend server with both game logics
- `package.json` - Node.js dependencies and configuration

## Mobile Support

The games are fully responsive and work on:
- Smartphones (iPhone, Android)
- Tablets
- Desktop computers

For the best mobile experience, rotate your device to landscape mode when playing.

## Troubleshooting

- **Can't connect**: Make sure your Render service is running and not asleep (free services sleep after inactivity)
- **Friends can't join**: Ensure they're using the exact same room code (case-sensitive)
- **Game lag**: Check your internet connection, the game requires stable connection
- **Can't switch games**: Only the host can switch games, and only before a game starts
