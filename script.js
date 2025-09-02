let CORRECT_WORD = 'MONEY';
let VALID_WORDS = [];

const gameState = {
    currentRow: 0,
    currentCol: 0,
    gameOver: false,
    board: Array(6).fill().map(() => Array(5).fill(''))
};

const gameBoard = document.getElementById('game-board');
const message = document.getElementById('message');
const keyboard = document.getElementById('keyboard');
const resetBtn = document.getElementById('reset-btn');
const customWordBtn = document.getElementById('custom-word-btn');
const customWordModal = document.getElementById('custom-word-modal');
const customWordInput = document.getElementById('custom-word-input');
const setWordBtn = document.getElementById('set-word-btn');
const cancelWordBtn = document.getElementById('cancel-word-btn');

async function loadValidWords() {
    try {
        showMessage('Loading word list...');
        const response = await fetch('https://gist.githubusercontent.com/dracos/dd0668f281e685bad51479e5acaadb93/raw/6bfa15d263d6d5b63840a8e5b64e04b382fdb079/valid-wordle-words.txt');
        const text = await response.text();
        VALID_WORDS = text.trim().split('\n').map(word => word.trim().toUpperCase());

        showMessage('Ready to play!');
        console.log('Loaded', VALID_WORDS.length, 'valid words');
    } catch (error) {
        console.error('Failed to load word list:', error);
        showMessage('Failed to load word list. Word validation disabled.');
        VALID_WORDS = [];
    }
}

function initializeBoard() {
    gameBoard.innerHTML = '';
    for (let row = 0; row < 6; row++) {
        const rowElement = document.createElement('div');
        rowElement.className = 'row';
        for (let col = 0; col < 5; col++) {
            const tile = document.createElement('div');
            tile.className = 'tile';
            tile.id = `tile-${row}-${col}`;
            rowElement.appendChild(tile);
        }
        gameBoard.appendChild(rowElement);
    }
}

function updateDisplay() {
    for (let row = 0; row < 6; row++) {
        for (let col = 0; col < 5; col++) {
            const tile = document.getElementById(`tile-${row}-${col}`);
            tile.textContent = gameState.board[row][col];
            if (gameState.board[row][col]) {
                tile.classList.add('filled');
            } else {
                tile.classList.remove('filled');
            }
        }
    }
}

function addLetter(letter) {
    if (gameState.currentCol < 5 && !gameState.gameOver) {
        gameState.board[gameState.currentRow][gameState.currentCol] = letter;
        gameState.currentCol++;
        updateDisplay();
    }
}

function deleteLetter() {
    if (gameState.currentCol > 0 && !gameState.gameOver) {
        gameState.currentCol--;
        gameState.board[gameState.currentRow][gameState.currentCol] = '';
        updateDisplay();
    }
}

function isValidWord(word) {
    return VALID_WORDS.length === 0 || VALID_WORDS.includes(word.toUpperCase());
}

function submitGuess() {
    if (gameState.currentCol === 5 && !gameState.gameOver) {
        const guess = gameState.board[gameState.currentRow].join('');

        if (!isValidWord(guess)) {
            showMessage('Not a valid word');
            const rowElement = document.querySelector(`#game-board .row:nth-child(${gameState.currentRow + 1})`);
            rowElement.classList.add('shake');
            setTimeout(() => {
                rowElement.classList.remove('shake');
            }, 500);
            return;
        }

        checkGuess(guess);
    } else if (gameState.currentCol < 5) {
        showMessage('Not enough letters');
    }
}

function checkGuess(guess) {
    const result = [];
    const correctLetters = CORRECT_WORD.split('');
    const guessLetters = guess.split('');

    for (let i = 0; i < 5; i++) {
        if (guessLetters[i] === correctLetters[i]) {
            result[i] = 'correct';
            correctLetters[i] = null;
            guessLetters[i] = null;
        }
    }

    for (let i = 0; i < 5; i++) {
        if (guessLetters[i] !== null) {
            const foundIndex = correctLetters.findIndex(letter => letter === guessLetters[i]);
            if (foundIndex !== -1) {
                result[i] = 'present';
                correctLetters[foundIndex] = null;
            } else {
                result[i] = 'absent';
            }
        }
    }

    animateRow(gameState.currentRow, result);
    updateKeyboard(guess, result);

    if (guess === CORRECT_WORD) {
        gameState.gameOver = true;
        const messages = ['Genius!', 'Magnificent!', 'Impressive!', 'Splendid!', 'Great!', 'Phew!'];
        showMessage(messages[gameState.currentRow] || 'Excellent!');
    } else if (gameState.currentRow === 5) {
        gameState.gameOver = true;
        showMessage(`The word was ${CORRECT_WORD}`);
    } else {
        gameState.currentRow++;
        gameState.currentCol = 0;
    }
}

function animateRow(row, result) {
    for (let col = 0; col < 5; col++) {
        const tile = document.getElementById(`tile-${row}-${col}`);
        setTimeout(() => {
            tile.classList.add('flip');
            tile.classList.add(result[col]);
        }, col * 100);
    }
}

function updateKeyboard(guess, result) {
    for (let i = 0; i < guess.length; i++) {
        const letter = guess[i];
        const keyElement = document.querySelector(`[data-key="${letter}"]`);
        if (keyElement) {
            if (result[i] === 'correct') {
                keyElement.className = 'correct';
            } else if (result[i] === 'present' && !keyElement.classList.contains('correct')) {
                keyElement.className = 'present';
            } else if (result[i] === 'absent' && !keyElement.classList.contains('correct') && !keyElement.classList.contains('present')) {
                keyElement.className = 'absent';
            }
        }
    }
}

function showMessage(text) {
    message.textContent = text;
    setTimeout(() => {
        message.textContent = '';
    }, 3000);
}

function showCustomWordModal() {
    customWordModal.style.display = 'flex';
    customWordInput.value = '';
    customWordInput.focus();
}

function hideCustomWordModal() {
    customWordModal.style.display = 'none';
}

function setCustomWord() {
    const word = customWordInput.value.trim().toUpperCase();

    if (word.length !== 5) {
        showMessage('Word must be exactly 5 letters');
        return;
    }

    if (!/^[A-Z]+$/.test(word)) {
        showMessage('Word must contain only letters');
        return;
    }

    if (VALID_WORDS.length > 0 && !VALID_WORDS.includes(word)) {
        showMessage('Word not in valid word list');
        return;
    }

    CORRECT_WORD = word;
    hideCustomWordModal();
    resetGame();
    showMessage(`New word set! Game reset.`);
}

function resetGame() {
    gameState.currentRow = 0;
    gameState.currentCol = 0;
    gameState.gameOver = false;
    gameState.board = Array(6).fill().map(() => Array(5).fill(''));

    message.textContent = '';

    document.querySelectorAll('.tile').forEach(tile => {
        tile.className = 'tile';
        tile.textContent = '';
    });

    document.querySelectorAll('#keyboard button').forEach(button => {
        button.className = button.classList.contains('wide') ? 'wide' : '';
    });

    updateDisplay();
}

keyboard.addEventListener('click', (e) => {
    if (e.target.matches('button')) {
        const key = e.target.dataset.key;
        handleInput(key);
    }
});

document.addEventListener('keydown', (e) => {
    const key = e.key.toUpperCase();
    if (key.match(/^[A-Z]$/)) {
        handleInput(key);
    } else if (key === 'ENTER') {
        handleInput('ENTER');
    } else if (key === 'BACKSPACE') {
        handleInput('BACKSPACE');
    }
});

function handleInput(key) {
    if (key === 'ENTER') {
        submitGuess();
    } else if (key === 'BACKSPACE') {
        deleteLetter();
    } else if (key.match(/^[A-Z]$/)) {
        addLetter(key);
    }
}

resetBtn.addEventListener('click', resetGame);
customWordBtn.addEventListener('click', showCustomWordModal);
setWordBtn.addEventListener('click', setCustomWord);
cancelWordBtn.addEventListener('click', hideCustomWordModal);
customWordModal.addEventListener('click', (e) => {
    if (e.target === customWordModal) {
        hideCustomWordModal();
    }
});

customWordInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        setCustomWord();
    } else if (e.key === 'Escape') {
        hideCustomWordModal();
    }
});

async function initGame() {
    initializeBoard();
    await loadValidWords();
    updateDisplay();
}

initGame();
