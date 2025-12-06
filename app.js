/**
 * ONE PIECE MEMORY GAME
 * Jogo da Memoria com tema One Piece
 */

document.addEventListener('DOMContentLoaded', () => {
    // ===================================
    // GAME CONFIGURATION
    // ===================================

    const CONFIG = {
        difficulties: {
            easy: { pairs: 4, cols: 4 },
            medium: { pairs: 6, cols: 4 },
            hard: { pairs: 8, cols: 4 }
        },
        flipDelay: 1000,
        matchDelay: 500,
        toastDuration: 2000,
        confettiCount: 50,
        maxLeaderboardEntries: 10
    };

    // Card images - all available Zoro images
    // We have 8 unique images, for hard mode we need 12 so we'll adjust difficulty
    const ALL_CARDS = [
        { name: 'zoro1', img: 'images/zoro1.jpeg' },
        { name: 'zoro2', img: 'images/zoro2.jpeg' },
        { name: 'zoro3', img: 'images/zoro3.jpeg' },
        { name: 'zoro4', img: 'images/zoro4.jpeg' },
        { name: 'zoro5', img: 'images/zoro5.jpeg' },
        { name: 'zoro6', img: 'images/zoro6.jpeg' },
        { name: 'zoro7', img: 'images/zoro7.jpeg' },
        { name: 'zoro8', img: 'images/images.jpeg' }
    ];

    // ===================================
    // GAME STATE
    // ===================================

    let gameState = {
        difficulty: 'medium',
        cards: [],
        flippedCards: [],
        matchedPairs: 0,
        totalPairs: 8,
        moves: 0,
        timer: 0,
        timerInterval: null,
        isLocked: false,
        gameStarted: false,
        soundEnabled: true
    };

    // ===================================
    // DOM ELEMENTS
    // ===================================

    const elements = {
        // Screens
        startScreen: document.getElementById('start-screen'),
        gameScreen: document.getElementById('game-screen'),
        leaderboardScreen: document.getElementById('leaderboard-screen'),

        // Game elements
        grid: document.getElementById('game-grid'),
        timerDisplay: document.getElementById('timer'),
        movesDisplay: document.getElementById('moves'),
        pairsDisplay: document.getElementById('pairs'),

        // Buttons
        btnStart: document.getElementById('btn-start'),
        btnLeaderboard: document.getElementById('btn-leaderboard'),
        btnBackMenu: document.getElementById('btn-back-menu'),
        btnRestart: document.getElementById('btn-restart'),
        btnMenu: document.getElementById('btn-menu'),
        difficultyBtns: document.querySelectorAll('.btn-difficulty'),

        // Leaderboard
        leaderboardList: document.getElementById('leaderboard-list'),
        tabBtns: document.querySelectorAll('.tab-btn'),

        // Victory modal
        victoryModal: document.getElementById('victory-modal'),
        finalTime: document.getElementById('final-time'),
        finalMoves: document.getElementById('final-moves'),
        playerNameInput: document.getElementById('player-name'),
        btnSaveScore: document.getElementById('btn-save-score'),
        btnPlayAgain: document.getElementById('btn-play-again'),
        confettiContainer: document.getElementById('confetti'),

        // Toast
        toastContainer: document.getElementById('toast-container')
    };

    // ===================================
    // AUDIO SYSTEM
    // ===================================

    const AudioManager = {
        sounds: {},

        init() {
            // Create audio context for generating sounds
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        },

        playFlip() {
            if (!gameState.soundEnabled) return;
            this.playTone(800, 0.1, 'square');
        },

        playMatch() {
            if (!gameState.soundEnabled) return;
            this.playTone(523, 0.15, 'sine');
            setTimeout(() => this.playTone(659, 0.15, 'sine'), 100);
            setTimeout(() => this.playTone(784, 0.2, 'sine'), 200);
        },

        playNoMatch() {
            if (!gameState.soundEnabled) return;
            this.playTone(200, 0.2, 'sawtooth');
        },

        playVictory() {
            if (!gameState.soundEnabled) return;
            const notes = [523, 587, 659, 698, 784, 880, 988, 1047];
            notes.forEach((freq, i) => {
                setTimeout(() => this.playTone(freq, 0.15, 'sine'), i * 100);
            });
        },

        playTone(frequency, duration, type = 'sine') {
            if (!this.audioContext) return;

            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);

            oscillator.frequency.value = frequency;
            oscillator.type = type;

            gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);

            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + duration);
        }
    };

    // ===================================
    // SCREEN MANAGEMENT
    // ===================================

    function showScreen(screenId) {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        document.getElementById(screenId).classList.add('active');
    }

    // ===================================
    // TIMER FUNCTIONS
    // ===================================

    function startTimer() {
        gameState.timer = 0;
        updateTimerDisplay();
        gameState.timerInterval = setInterval(() => {
            gameState.timer++;
            updateTimerDisplay();
        }, 1000);
    }

    function stopTimer() {
        if (gameState.timerInterval) {
            clearInterval(gameState.timerInterval);
            gameState.timerInterval = null;
        }
    }

    function updateTimerDisplay() {
        const minutes = Math.floor(gameState.timer / 60);
        const seconds = gameState.timer % 60;
        elements.timerDisplay.textContent =
            `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    function formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    // ===================================
    // GAME LOGIC
    // ===================================

    function initGame() {
        // Reset state
        gameState.cards = [];
        gameState.flippedCards = [];
        gameState.matchedPairs = 0;
        gameState.moves = 0;
        gameState.isLocked = false;
        gameState.gameStarted = false;

        // Get difficulty settings
        const difficulty = CONFIG.difficulties[gameState.difficulty];
        gameState.totalPairs = difficulty.pairs;

        // Create card deck
        const selectedCards = ALL_CARDS.slice(0, difficulty.pairs);
        const cardPairs = [...selectedCards, ...selectedCards.map(card => ({ ...card, name: card.name + '_pair' }))];

        // Shuffle cards
        gameState.cards = shuffleArray(cardPairs);

        // Update UI
        updateStats();
        renderGrid(difficulty.cols);

        // Stop any existing timer
        stopTimer();
    }

    function shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    function renderGrid(cols) {
        elements.grid.innerHTML = '';
        elements.grid.className = `grid ${gameState.difficulty}`;

        gameState.cards.forEach((card, index) => {
            const cardElement = createCardElement(card, index);
            elements.grid.appendChild(cardElement);
        });
    }

    function createCardElement(card, index) {
        const cardDiv = document.createElement('div');
        cardDiv.className = 'card';
        cardDiv.dataset.index = index;
        cardDiv.dataset.name = card.name.replace('_pair', '');

        cardDiv.innerHTML = `
            <div class="card-face card-front"></div>
            <div class="card-face card-back">
                <img src="${card.img}" alt="Card">
            </div>
        `;

        cardDiv.addEventListener('click', () => handleCardClick(cardDiv, index));

        return cardDiv;
    }

    function handleCardClick(cardElement, index) {
        // Ignore if card already flipped or matched
        if (cardElement.classList.contains('flipped')) return;
        if (cardElement.classList.contains('matched')) return;

        // If there are 2 unmatched cards showing, hide them immediately and flip the new one
        if (gameState.flippedCards.length === 2) {
            // Immediately hide the previous two cards
            const [card1, card2] = gameState.flippedCards;
            card1.element.classList.remove('flipped', 'no-match');
            card2.element.classList.remove('flipped', 'no-match');
            gameState.flippedCards = [];
            gameState.isLocked = false;
        }

        // Start timer on first click
        if (!gameState.gameStarted) {
            gameState.gameStarted = true;
            startTimer();
        }

        // Initialize audio on first interaction
        if (!AudioManager.audioContext) {
            AudioManager.init();
        }

        // Flip card
        cardElement.classList.add('flipped');
        AudioManager.playFlip();

        // Track flipped cards
        gameState.flippedCards.push({
            element: cardElement,
            index: index,
            name: cardElement.dataset.name
        });

        // Check for match when two cards are flipped
        if (gameState.flippedCards.length === 2) {
            gameState.moves++;
            updateStats();
            checkForMatch();
        }
    }

    function checkForMatch() {
        const [card1, card2] = gameState.flippedCards;
        const isMatch = card1.name === card2.name;

        if (isMatch) {
            handleMatch(card1, card2);
        } else {
            handleNoMatch(card1, card2);
        }
    }

    function handleMatch(card1, card2) {
        // Mark as matched immediately
        card1.element.classList.add('matched');
        card2.element.classList.add('matched');

        AudioManager.playMatch();
        showToast('Par encontrado!', 'match');

        gameState.matchedPairs++;
        updateStats();

        // Clear flipped cards - they are now matched
        gameState.flippedCards = [];

        // Check for victory
        if (gameState.matchedPairs === gameState.totalPairs) {
            handleVictory();
        }
    }

    function handleNoMatch(card1, card2) {
        // Add no-match animation class
        card1.element.classList.add('no-match');
        card2.element.classList.add('no-match');

        AudioManager.playNoMatch();

        // Don't lock - allow user to click another card immediately
        // The cards will be hidden when the user clicks a new card
        gameState.isLocked = false;
    }

    function updateStats() {
        elements.movesDisplay.textContent = gameState.moves;
        elements.pairsDisplay.textContent = `${gameState.matchedPairs}/${gameState.totalPairs}`;
    }

    // ===================================
    // VICTORY HANDLING
    // ===================================

    function handleVictory() {
        stopTimer();
        AudioManager.playVictory();

        // Update modal stats
        elements.finalTime.textContent = formatTime(gameState.timer);
        elements.finalMoves.textContent = gameState.moves;

        // Show modal with delay
        setTimeout(() => {
            elements.victoryModal.classList.add('active');
            createConfetti();
        }, 500);
    }

    function createConfetti() {
        elements.confettiContainer.innerHTML = '';

        const colors = ['#ffd700', '#dc143c', '#1e90ff', '#ffffff', '#ff4757'];

        for (let i = 0; i < CONFIG.confettiCount; i++) {
            const confetti = document.createElement('div');
            confetti.className = 'confetti';
            confetti.style.left = Math.random() * 100 + '%';
            confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            confetti.style.animationDuration = (Math.random() * 2 + 2) + 's';
            confetti.style.animationDelay = Math.random() * 0.5 + 's';

            elements.confettiContainer.appendChild(confetti);
        }
    }

    function closeVictoryModal() {
        elements.victoryModal.classList.remove('active');
        elements.confettiContainer.innerHTML = '';
    }

    // ===================================
    // LEADERBOARD
    // ===================================

    function getLeaderboard(difficulty) {
        const key = `memoryGame_leaderboard_${difficulty}`;
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : [];
    }

    function saveToLeaderboard(difficulty, entry) {
        const leaderboard = getLeaderboard(difficulty);
        leaderboard.push(entry);

        // Sort by time, then by moves
        leaderboard.sort((a, b) => {
            if (a.time !== b.time) return a.time - b.time;
            return a.moves - b.moves;
        });

        // Keep only top entries
        const trimmed = leaderboard.slice(0, CONFIG.maxLeaderboardEntries);

        const key = `memoryGame_leaderboard_${difficulty}`;
        localStorage.setItem(key, JSON.stringify(trimmed));

        return trimmed.findIndex(e => e === entry) + 1;
    }

    function renderLeaderboard(difficulty) {
        const leaderboard = getLeaderboard(difficulty);

        if (leaderboard.length === 0) {
            elements.leaderboardList.innerHTML = `
                <div class="leaderboard-empty">
                    Nenhuma pontuacao registrada ainda.
                </div>
            `;
            return;
        }

        elements.leaderboardList.innerHTML = leaderboard.map((entry, index) => {
            let rankClass = '';
            if (index === 0) rankClass = 'gold';
            else if (index === 1) rankClass = 'silver';
            else if (index === 2) rankClass = 'bronze';

            return `
                <div class="leaderboard-item ${rankClass}">
                    <span class="leaderboard-rank">${index + 1}</span>
                    <span class="leaderboard-name">${escapeHtml(entry.name)}</span>
                    <span class="leaderboard-score">
                        <span>${formatTime(entry.time)}</span>
                        <span>${entry.moves} movimentos</span>
                    </span>
                </div>
            `;
        }).join('');
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // ===================================
    // TOAST NOTIFICATIONS
    // ===================================

    function showToast(message, type = 'default') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;

        let icon = '';
        switch (type) {
            case 'match':
                icon = '⭐';
                break;
            case 'success':
                icon = '✓';
                break;
            case 'error':
                icon = '✗';
                break;
            default:
                icon = 'ℹ';
        }

        toast.innerHTML = `
            <span class="toast-icon">${icon}</span>
            <span class="toast-message">${message}</span>
        `;

        elements.toastContainer.appendChild(toast);

        setTimeout(() => {
            toast.classList.add('hide');
            setTimeout(() => toast.remove(), 300);
        }, CONFIG.toastDuration);
    }

    // ===================================
    // EVENT HANDLERS
    // ===================================

    // Start game button
    elements.btnStart.addEventListener('click', () => {
        showScreen('game-screen');
        initGame();
    });

    // Leaderboard button
    elements.btnLeaderboard.addEventListener('click', () => {
        showScreen('leaderboard-screen');
        renderLeaderboard('easy');
        updateTabButtons('easy');
    });

    // Back to menu button
    elements.btnBackMenu.addEventListener('click', () => {
        showScreen('start-screen');
    });

    // Restart button
    elements.btnRestart.addEventListener('click', () => {
        stopTimer();
        initGame();
        showToast('Jogo reiniciado!', 'default');
    });

    // Menu button
    elements.btnMenu.addEventListener('click', () => {
        stopTimer();
        showScreen('start-screen');
    });

    // Difficulty buttons
    elements.difficultyBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            elements.difficultyBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            gameState.difficulty = btn.dataset.difficulty;
        });
    });

    // Leaderboard tabs
    elements.tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const difficulty = btn.dataset.tab;
            updateTabButtons(difficulty);
            renderLeaderboard(difficulty);
        });
    });

    function updateTabButtons(activeDifficulty) {
        elements.tabBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === activeDifficulty);
        });
    }

    // Save score button
    elements.btnSaveScore.addEventListener('click', () => {
        const playerName = elements.playerNameInput.value.trim() || 'Jogador';

        const entry = {
            name: playerName,
            time: gameState.timer,
            moves: gameState.moves,
            date: new Date().toISOString()
        };

        const position = saveToLeaderboard(gameState.difficulty, entry);
        showToast(`Pontuacao salva! Posicao: ${position}`, 'success');

        closeVictoryModal();
        showScreen('leaderboard-screen');
        renderLeaderboard(gameState.difficulty);
        updateTabButtons(gameState.difficulty);
    });

    // Play again button
    elements.btnPlayAgain.addEventListener('click', () => {
        closeVictoryModal();
        initGame();
    });

    // Close modal on backdrop click
    elements.victoryModal.addEventListener('click', (e) => {
        if (e.target === elements.victoryModal) {
            closeVictoryModal();
        }
    });

    // Enter key in name input
    elements.playerNameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            elements.btnSaveScore.click();
        }
    });

    // ===================================
    // INITIALIZATION
    // ===================================

    // Set initial difficulty from button
    const activeBtn = document.querySelector('.btn-difficulty.active');
    if (activeBtn) {
        gameState.difficulty = activeBtn.dataset.difficulty;
    }

    console.log('One Piece Memory Game loaded!');
});
