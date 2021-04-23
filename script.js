/**
 * Author: oliviercm @ https://github.com/oliviercm
 * 
 * This is an HTML+CSS+JS Tetris clone.
 * 
 * No libraries are used in this game's code.
 * 
 * Gameplay is mostly designed around the 2009 Tetris Design Guideline published by the Tetris Company.
 * A copy of the guideline is included next to this file.
 * Some of Tetris Guideline mechanics included in this clone are:
 * - (3.1) Tetromino shapes & colors
 * - (3.4) Tetromino starting location & orientation
 * - (2.4.4) Ghost tetromino
 * - (2.4.1) Visible playfield size
 * - (10.0) Playfield vertical buffer zone
 * - (3.3) "Bag system" random tetromino generation
 * - (5.3) "Super Rotation System", allowing rotation against walls and surfaces (wall-kicks)
 * - (5.4) Hard Drop
 * - (5.5) Soft Drop
 * - (5.6) Hold
 * - (5.7) Extended placement lock down
 */

const canvas = document.getElementById("game-canvas");
const context = canvas.getContext("2d");

const nextCanvas = document.getElementById("next-canvas");
const nextContext = nextCanvas.getContext("2d");

const holdCanvas = document.getElementById("hold-canvas");
const holdContext = holdCanvas.getContext("2d");

// Define core gameplay constants
const PLAYFIELD_WIDTH = 10;
const PLAYFIELD_HEIGHT = 20;
const PLAYFIELD_HEIGHT_BUFFER = 20; // The "buffer zone" above the visible playfield, as described by the Tetris Guideline.
const CELL_WIDTH = canvas.width / PLAYFIELD_WIDTH;
const CELL_HEIGHT = canvas.height / PLAYFIELD_HEIGHT;
const TETROMINO_COLORS = { // Tetromino colors, as described by the Tetris Guideline.
    o: "rgba(255, 255, 0, 255)",
    i: "rgba(0, 255, 255, 255)",
    t: "rgba(128, 0, 128, 255)",
    l: "rgba(255, 165, 0, 255)",
    j: "rgba(0, 0, 139, 255)",
    s: "rgba(0, 128, 0, 255)",
    z: "rgba(255, 0, 0, 255)",
};
const TETROMINOS = { // The shape of each of the 7 tetrominos and their 4 rotations. The shape is described as a matrix where true values are the tetromino and false values are "empty".
    o: {
        [0]: [
            [false, false, false, false],
            [false, true, true, false],
            [false, true, true, false],
        ],
        [1]: [
            [false, false, false, false],
            [false, true, true, false],
            [false, true, true, false],
        ],
        [2]: [
            [false, false, false, false],
            [false, true, true, false],
            [false, true, true, false],
        ],
        [3]: [
            [false, false, false, false],
            [false, true, true, false],
            [false, true, true, false],
        ],
    },
    i: {
        [0]: [
            [false, false, false, false],
            [false, false, false, false],
            [true, true, true, true],
            [false, false, false, false],
        ],
        [1]: [
            [false, false, true, false],
            [false, false, true, false],
            [false, false, true, false],
            [false, false, true, false],
        ],
        [2]: [
            [false, false, false, false],
            [true, true, true, true],
            [false, false, false, false],
            [false, false, false, false],
        ],
        [3]: [
            [false, true, false, false],
            [false, true, false, false],
            [false, true, false, false],
            [false, true, false, false],
        ],
    },
    t: {
        [0]: [
            [false, false, false],
            [true, true, true],
            [false, true, false],
        ],
        [1]: [
            [false, true, false],
            [false, true, true],
            [false, true, false],
        ],
        [2]: [
            [false, true, false],
            [true, true, true],
            [false, false, false],
        ],
        [3]: [
            [false, true, false],
            [true, true, false],
            [false, true, false],
        ],
    },
    l: {
        [0]: [
            [false, false, false],
            [true, true, true],
            [false, false, true],
        ],
        [1]: [
            [false, true, true],
            [false, true, false],
            [false, true, false],
        ],
        [2]: [
            [true, false, false],
            [true, true, true],
            [false, false, false],
        ],
        [3]: [
            [false, true, false],
            [false, true, false],
            [true, true, false],
        ],
    },
    j: {
        [0]: [
            [false, false, false],
            [true, true, true],
            [true, false, false],
        ],
        [1]: [
            [false, true, false],
            [false, true, false],
            [false, true, true],
        ],
        [2]: [
            [false, false, true],
            [true, true, true],
            [false, false, false],
        ],
        [3]: [
            [true, true, false],
            [false, true, false],
            [false, true, false],
        ],
    },
    s: {
        [0]: [
            [false, false, false],
            [true, true, false],
            [false, true, true],
        ],
        [1]: [
            [false, false, true],
            [false, true, true],
            [false, true, false],
        ],
        [2]: [
            [true, true, false],
            [false, true, true],
            [false, false, false],
        ],
        [3]: [
            [false, true, false],
            [true, true, false],
            [true, false, false],
        ],
    },
    z: {
        [0]: [
            [false, false, false],
            [false, true, true],
            [true, true, false],
        ],
        [1]: [
            [false, true, false],
            [false, true, true],
            [false, false, true],
        ],
        [2]: [
            [false, true, true],
            [true, true, false],
            [false, false, false],
        ],
        [3]: [
            [true, false, false],
            [true, true, false],
            [false, true, false],
        ],
    },
};
const KICK_OFFSETS = { // Super Rotation System kick offsets when rotating pieces (allowing rotation against walls and surfaces, t-spins, etc.)
    normal: { // Used for all tetrominos except the I tetromino.
        [0]: {
            [-1]: [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]],
            [1]: [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],
        },
        [1]: {
            [-1]: [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],
            [1]: [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],
        },
        [2]: {
            [-1]: [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],
            [1]: [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]],
        },
        [3]: {
            [-1]: [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],
            [1]: [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],
        },
    },
    modified: { // Used for the I tetromino exclusively.
        [0]: {
            [-1]: [[0, 0], [-1, 0], [2, 0], [-1, 2], [2, -1]],
            [1]: [[0, 0], [-2, 0], [1, 0], [-2, -1], [1, 2]],
        },
        [1]: {
            [-1]: [[0, 0], [2, 0], [-1, 0], [2, 1], [-1, -2]],
            [1]: [[0, 0], [-1, 0], [2, 0], [-1, 2], [2, -1]],
        },
        [2]: {
            [-1]: [[0, 0], [1, 0], [-2, 0], [1, -2], [-2, 1]],
            [1]: [[0, 0], [2, 0], [-1, 0], [2, 1], [-1, -2]],
        },
        [3]: {
            [-1]: [[0, 0], [-2, 0], [1, 0], [-2, -1], [1, 2]],
            [1]: [[0, 0], [1, 0], [-2, 0], [1, -2], [-2, 1]],
        },
    },
};
const AUDIO = {
    rotate: new Audio("./sounds/rotate.mp3"),
    land: new Audio("./sounds/land.mp3"),
    line: new Audio("./sounds/line.mp3"),
    tetris: new Audio("./sounds/tetris.mp3"),
    move: new Audio("./sounds/move.mp3"),
    gameover: new Audio("./sounds/gameover.mp3"),
    level: new Audio("./sounds/level.mp3"),
    theme: new Audio("./sounds/theme.mp3"),
    pause: new Audio("./sounds/pause.mp3"),
    shift: new Audio("./sounds/shift.mp3"),
};
const TPS = 60; // Frames/ticks per second
const TICKS_PER_CELL = { // Amount of ticks before dropping tetromino 1 cell due to gravity based on difficulty
    [1]: 36,
    [2]: 32,
    [3]: 29,
    [4]: 25,
    [5]: 22,
    [6]: 18,
    [7]: 15,
    [8]: 11,
    [9]: 7,
    [10]: 5,
    [11]: 4,
    [12]: 4,
    [13]: 4,
    [14]: 3,
    [15]: 3,
    [16]: 3,
    [17]: 2,
    [18]: 2,
    [19]: 2,
    [20]: 1,
};
const REQUIRED_LINES_PER_LEVEL = { // Amount of cleared lines needed for each level (cumulative)
    [1]: 0,
    [2]: 10,
    [3]: 20,
    [4]: 30,
    [5]: 40,
    [6]: 50,
    [7]: 60,
    [8]: 70,
    [9]: 80,
    [10]: 90,
    [11]: 100,
    [12]: 110,
    [13]: 120,
    [14]: 130,
    [15]: 140,
    [16]: 150,
    [17]: 160,
    [18]: 170,
    [19]: 180,
    [20]: 190,
};

// Core game variables
const gameVars = {
    active: false, // Whether a game is active or not (the game is not active during the loading screen, before the user has clicked on the main canvas, and after a game over)
    paused: false,
    gameOver: false,
    globalTick: 0, // How many ticks have passed since the game has become active. Used to determine when to move tetromino due to gravity
    difficulty: 1, // The overall difficulty. A higher difficulty means gravity will act faster. Valid values are between 1 and 20.
    score: 0, // The player's current score.
    clearedLines: 0, // The amount of lines cleared, used to increase the difficulty level at certain thresholds.
    tetrominoBag: [], // Stores the bag of tetrominos which the player pulls from. When empty, it is refilled with a shuffled bag of each of the 7 tetrominos.
    highScore: JSON.parse(localStorage.getItem("highscore") || "0"),
};

// Information about the currently controlled tetromino
const playerVars = {
    controlledTetrominoShape: null, // "o", "i", "z", etc.
    controlledTetrominoPositionX: null,
    controlledTetrominoPositionY: null,
    controlledTetrominoRotation: null, // 0 = north, 1 = east, 2 = south, 3 = west
    controlledTetrominoLockDelay: null, // Ticks before the tetromino locks in place (when touching ground)
    controlledTetrominoLockDelayExtensions: null, // The amount of times the player has reset the lock delay by rotating/moving the controlled tetromino. Maximum of 15 times, which is reset when the controlled tetromino reaches a new lowest line.
    controlledTetrominoLowestLine: null, // The lowest line the controlled tetromino has reached. Reaching a new lowest line resets the amount of allowed lock delay extensions to 15.
    heldTetromino: null, // The currently held tetromino.
    hasHeldTetromino: false,
    keyStates: {
        left: {
            pressed: false,
            heldTicks: 0,
        },
        right: {
            pressed: false,
            heldTicks: 0,
        },
        down: {
            pressed: false,
            heldTicks: 0,
        },
    },
};

// Initialize playfield matrix (stores position of locked tetrominos)
// Note that there is a 20 line vertical buffer above the visible playfield.
let playfield = Array(PLAYFIELD_WIDTH).fill().map(() => Array(PLAYFIELD_HEIGHT + PLAYFIELD_HEIGHT_BUFFER).fill(null));

/**
 * MAIN GAMEPLAY CODE
 */

async function initialize() {
    drawLoadingScreen();
    drawStoredHighscore();

    await loadResources();

    drawMenu();
    addEventListeners();

    setInterval(tick, 1000 / TPS);
};

function loadResources() {
    const promises = [];

    const font = new FontFace("PressStart", "url('./fonts/PressStart2P-Regular.ttf')");
    promises.push(font.load().then(() => {
        document.fonts.add(font);
    }));

    for (const audio in AUDIO) {
        let cb;
        promises.push(new Promise((resolve, reject) => {
            cb = resolve;
            AUDIO[audio].addEventListener("canplaythrough", cb);
        }).then(() => {
            AUDIO[audio].removeEventListener("canplaythrough", cb);
        }));
    };

    return Promise.all(promises);
};

function drawLoadingScreen() {
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.textAlign = "center";
    context.font = "bold 32px sans-serif";
    context.fillText("Loading...", canvas.width / 2, canvas.height / 2);
};

function drawMenu() {
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.textAlign = "center";
    context.font = "bold 18px PressStart";
    context.fillText("Click here to start.", canvas.width / 2, canvas.height / 2);
};

function addEventListeners() {
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("keyup", handleKeyUp)
    canvas.addEventListener("click", handleClick);
};

function startGame() {
    gameVars.active = true;
    gameVars.paused = false;
    gameVars.gameOver = false;
    gameVars.globalTick = 0;
    gameVars.difficulty = 1;
    gameVars.score = 0;
    gameVars.clearedLines = 0;
    gameVars.tetrominoBag = [];

    playerVars.controlledTetrominoShape = null;
    playerVars.controlledTetrominoPositionX = null;
    playerVars.controlledTetrominoPositionY = null;
    playerVars.controlledTetrominoRotation = null;
    playerVars.controlledTetrominoLockDelay = null;
    playerVars.controlledTetrominoLockDelayExtensions = null;
    playerVars.controlledTetrominoLowestLine = null;
    playerVars.heldTetromino = null;
    playerVars.hasHeldTetromino = false;
    playerVars.keys = {
        z: {
            isDown: false,
            heldTicks: 0,
        },
        x: {
            isDown: false,
            heldTicks: 0,
        },
        left: {
            isDown: false,
            heldTicks: 0,
        },
        right: {
            isDown: false,
            heldTicks: 0,
        },
    };

    initializePlayfield();
    drawPlayField();
    dealTetrominos();
    createControlledTetromino();
    playTheme();
};

function pauseGame() {
    if (!gameVars.active) {
        return;
    };
    if (gameVars.paused) {
        gameVars.paused = false;
        AUDIO.theme.play();
    } else {
        gameVars.paused = true;
        AUDIO.theme.pause();
    };
    playSound(AUDIO.pause);
    drawPauseText();
};

function tick() {
    if (gameVars.active && !gameVars.paused) {
        gameVars.globalTick += 1;
        handleKeyStates();
        tetrominoGravity();
        drawPlayField();
    };
};

function initializePlayfield() {
    playfield = Array(PLAYFIELD_WIDTH).fill().map(() => Array(PLAYFIELD_HEIGHT + PLAYFIELD_HEIGHT_BUFFER).fill(null));
};

function drawPlayField() {
    context.clearRect(0, 0, canvas.width, canvas.height);
    drawCells();
    drawGhost();
    drawControlledTetromino();
    drawNextTetromino();
    drawHeldTetromino();
    drawStats();
    drawGameoverText();
};

function drawCells() {
    for (let x = 0; x < playfield.length; x++) {
        const column = playfield[x];
        for (let y = 0; y < column.length; y++) {
            const cell = column[y];
            if (cell) {
                drawCell(x, y, cell);
            };
        };
    };
};

function drawCell(x, y, color) {
    context.fillStyle = TETROMINO_COLORS[color] || "black";
    context.fillRect(CELL_WIDTH * x, CELL_HEIGHT * (PLAYFIELD_HEIGHT - y - 1), CELL_WIDTH, CELL_HEIGHT);
};

function drawControlledTetromino() {
    if (playerVars.controlledTetrominoShape) {
        const tetromino = TETROMINOS[playerVars.controlledTetrominoShape][playerVars.controlledTetrominoRotation];
        for (let row = 0; row < tetromino.length; row++) {
            for (let column = 0; column < tetromino[row].length; column++) {
                if (tetromino[row][column]) {
                    drawCell(playerVars.controlledTetrominoPositionX + column, playerVars.controlledTetrominoPositionY + row, playerVars.controlledTetrominoShape);
                };
            };
        };
    };
};

function drawGameoverText() {
    if (gameVars.gameOver) {
        const borderSize = 4;
        context.fillStyle = "black";
        context.fillRect(12 - borderSize, canvas.height / 2 - 64 - borderSize, canvas.width - 24 + (borderSize * 2), 128 + (borderSize * 2));
        context.fillStyle = "white";
        context.fillRect(12, canvas.height / 2 - 64, canvas.width - 24, 128);
        context.fillStyle = "black";
        context.textAlign = "center";
        context.font = "bold 32px PressStart";
        context.fillText("GAME OVER!", canvas.width / 2, canvas.height / 2);
        context.font = "bold 16px PressStart";
        context.fillText("Click here to restart.", canvas.width / 2, canvas.height / 2 + 40);
    };
};

function drawPauseText() {
    const borderSize = 4;
        context.fillStyle = "black";
        context.fillRect(12 - borderSize, canvas.height / 2 - 64 - borderSize, canvas.width - 24 + (borderSize * 2), 128 + (borderSize * 2));
        context.fillStyle = "white";
        context.fillRect(12, canvas.height / 2 - 64, canvas.width - 24, 128);
        context.fillStyle = "black";
        context.textAlign = "center";
        context.font = "bold 32px PressStart";
        context.fillText("PAUSED", canvas.width / 2, canvas.height / 2);
        context.font = "bold 16px PressStart";
        context.fillText("Press ENTER to start.", canvas.width / 2, canvas.height / 2 + 40);
};

function playTheme() {
    AUDIO.theme.currentTime = 0;
    AUDIO.theme.loop = true;
    AUDIO.theme.play();
};

/**
 * Draws a ghost tetromino by determining where the controlled tetromino will land if left uncontrolled, and drawing a transparent tetromino at the determined position.
 */
function drawGhost() {
    if (playerVars.controlledTetrominoShape) {
        const tetromino = TETROMINOS[playerVars.controlledTetrominoShape][playerVars.controlledTetrominoRotation];
        let offsetY = 0;
        while (tryMovement(0, offsetY - 1)) {
            offsetY -= 1;
        };
        for (let row = 0; row < tetromino.length; row++) {
            for (let column = 0; column < tetromino[row].length; column++) {
                if (tetromino[row][column]) {
                    context.globalAlpha = 0.3;
                    drawCell(playerVars.controlledTetrominoPositionX + column, playerVars.controlledTetrominoPositionY + row + offsetY, playerVars.controlledTetrominoShape);
                    context.globalAlpha = 1;
                };
            };
        };
    };
};

// Displays the next tetromino.
function drawNextTetromino() {
    nextContext.clearRect(0, 0, nextCanvas.width, nextCanvas.height);
    const nextTetromino = gameVars.tetrominoBag[gameVars.tetrominoBag.length - 1];
    if (nextTetromino) {
        nextContext.fillStyle = TETROMINO_COLORS[nextTetromino] || "black";
        const tetromino = TETROMINOS[nextTetromino][0];
        for (let row = 0; row < tetromino.length; row++) {
            for (let column = 0; column < tetromino[row].length; column++) {
                if (tetromino[row][column]) {
                    nextContext.fillRect(CELL_WIDTH * column + (tetromino[0].length === 3 ? 20 : 0), CELL_HEIGHT * (4 - row - 1) + (tetromino.length === 4 ? 20 : 0), CELL_WIDTH, CELL_HEIGHT);
                };
            };
        };
    };
};

// Displays the held tetromino.
function drawHeldTetromino() {
    holdContext.clearRect(0, 0, holdCanvas.width, holdCanvas.height);
    const heldTetromino = playerVars.heldTetromino;
    if (heldTetromino) {
        holdContext.fillStyle = TETROMINO_COLORS[heldTetromino] || "black";
        const tetromino = TETROMINOS[heldTetromino][0];
        for (let row = 0; row < tetromino.length; row++) {
            for (let column = 0; column < tetromino[row].length; column++) {
                if (tetromino[row][column]) {
                    holdContext.fillRect(CELL_WIDTH * column + (tetromino[0].length === 3 ? 20 : 0), CELL_HEIGHT * (4 - row - 1) + (tetromino.length === 4 ? 20 : 0), CELL_WIDTH, CELL_HEIGHT);
                };
            };
        };
    };
};

function drawStoredHighscore() {
    if (localStorage.getItem("highscore")) {
        const highElement = document.getElementById("highscore");
        highElement.textContent = JSON.parse(localStorage.getItem("highscore"));
    };
};

// Displays the current game statistics (score, level).
function drawStats() {
    const highElement = document.getElementById("highscore");
    highElement.textContent = Math.max(gameVars.highScore, gameVars.score);

    const scoreElement = document.getElementById("score");
    scoreElement.textContent = gameVars.score;

    const levelElement = document.getElementById("level");
    levelElement.textContent = gameVars.difficulty;
};

/**
 * Spawn a new tetromino for the player by drawing from the bag.
 * 
 * Following the Tetris Guidelines, the tetrominos:
 * - Are created in the guideline position
 * - Are created in the guideline rotation
 * - Immediately moved down 1 line if possible
 * - Cause a gameover if created inside another tetromino
 */
function createControlledTetromino(override) {
    const tetromino = override || gameVars.tetrominoBag.pop();
    if (gameVars.tetrominoBag.length <= 0) {
        dealTetrominos();
    };
    playerVars.controlledTetrominoShape = tetromino;
    playerVars.controlledTetrominoRotation = 0;
    playerVars.controlledTetrominoPositionX = Math.trunc(((PLAYFIELD_WIDTH - 1) / 2) - 1);
    playerVars.controlledTetrominoPositionY = PLAYFIELD_HEIGHT - 1;
    playerVars.controlledTetrominoLockDelay = TPS / 2;
    playerVars.controlledTetrominoLockDelayExtensions = 0;
    playerVars.controlledTetrominoLowestLine = playerVars.controlledTetrominoPositionY;
    if (playerVars.controlledTetrominoShape === "i") {
        playerVars.controlledTetrominoPositionY -= 1;
    };
    if (!tryMovement(0, 0)) {
        gameOver();
    };
    if (tryMovement(0, -1)) {
        playerVars.controlledTetrominoPositionY -= 1;
    };
};

/**
 * Reset the delay before the controlled tetromino locks in place when touching ground.
 * As described by the Tetris Guideline, delaying the lock 15 times or more causes the tetromino to immediately lock the next time it touches ground.
 */
function extendControlledTetrominoLockDelay() {
    playerVars.controlledTetrominoLockDelayExtensions += 1;
    if (playerVars.controlledTetrominoLockDelayExtensions < 15) {
        playerVars.controlledTetrominoLockDelay = playerVars.controlledTetrominoLockDelay = TPS / 2;
    } else if (playerVars.controlledTetrominoLockDelayExtensions >= 15) {
        playerVars.controlledTetrominoLockDelay = 0;
    };
};

/**
 * Test whether the controlled tetromino is allowed to be in the passed offset position + rotation.
 * This allows testing:
 * - Whether a movement/rotation will place the controlled tetromino inside another tetromino (not allowed)
 * - Whether a movement/rotation will place the controlled tetromino outside the playfield (not allowed)
 * - Whether the controlled tetromino is touching a surface directly below it (touching ground)
 * @returns {Boolean} ```true``` if the movement is valid, ```false``` if not
 */
function tryMovement(offsetX = 0, offsetY = 0, rotation = playerVars.controlledTetrominoRotation) {
    const tetromino = TETROMINOS[playerVars.controlledTetrominoShape][rotation];
    for (let row = 0; row < tetromino.length; row++) {
        for (let column = 0; column < tetromino[row].length; column++) {
            if (tetromino[row][column]) {
                const absoluteX = playerVars.controlledTetrominoPositionX + column + offsetX;
                const absoluteY = playerVars.controlledTetrominoPositionY + row + offsetY;
                if (absoluteX < 0 || absoluteX > PLAYFIELD_WIDTH - 1) {
                    return false;
                };
                if (absoluteY < 0 || absoluteY > PLAYFIELD_HEIGHT + PLAYFIELD_HEIGHT_BUFFER - 1) {
                    return false;
                };
                if (playfield[absoluteX][absoluteY]) {
                    return false;
                };
            };
        };
    };
    return true;
};

/**
 * Moves the controlled tetromino downwards every few ticks based on difficulty.
 * If the tetromino is moved downwards and reaches a new lowest line, the amount of lock delay extensions allowed is reset.
 * If the tetromino is touching ground, decreases the delay before automatically locking the piece into place.
 */
function tetrominoGravity() {
    if (tryMovement(0, -1)) {
        if (gameVars.globalTick % (TICKS_PER_CELL[gameVars.difficulty] || 1) === 0) {
            playerVars.controlledTetrominoPositionY -= 1;
            if (playerVars.controlledTetrominoPositionY < playerVars.controlledTetrominoLowestLine) {
                playerVars.controlledTetrominoLowestLine = playerVars.controlledTetrominoPositionY;
                playerVars.controlledTetrominoLockDelayExtensions = 0;
            };
        };
    } else {
        playerVars.controlledTetrominoLockDelay -= 1;
        if (playerVars.controlledTetrominoLockDelay <= 0) {
            lockControlledPiece();
        };
    };
};

function gameOver() {
    gameVars.active = false;
    gameVars.gameOver = true;
    drawPlayField();
    setTimeout(() => {
        playSound(AUDIO.gameover);
    }, 300);
    AUDIO.theme.pause();
    gameVars.highScore = Math.max(0, gameVars.score, gameVars.highScore || 0);
    if (gameVars.highScore > JSON.parse(localStorage.getItem("highscore") || "0")) {
        localStorage.setItem("highscore", JSON.stringify(gameVars.score));
    };
};

// Locks the controlled tetromino in place by adding it to the playfield.
// Immediately after adding the tetromino, score any filled lines and draw a new tetromino for the player.
function lockControlledPiece() {
    const tetromino = TETROMINOS[playerVars.controlledTetrominoShape][playerVars.controlledTetrominoRotation];
    for (let row = 0; row < tetromino.length; row++) {
        for (let column = 0; column < tetromino[row].length; column++) {
            if (tetromino[row][column]) {
                const absoluteX = playerVars.controlledTetrominoPositionX + column;
                const absoluteY = playerVars.controlledTetrominoPositionY + row;
                playfield[absoluteX][absoluteY] = playerVars.controlledTetrominoShape;
            };
        };
    };
    scoreLines();
    createControlledTetromino();
    playSound(AUDIO.land);
    playerVars.hasHeldTetromino = false;
};

function holdTetromino() {
    if (!playerVars.hasHeldTetromino) {
        if (!playerVars.heldTetromino) {
            playerVars.heldTetromino = playerVars.controlledTetrominoShape;
            createControlledTetromino();
        } else {
            const temp = playerVars.heldTetromino;
            playerVars.heldTetromino = playerVars.controlledTetrominoShape;
            createControlledTetromino(temp);
        };
        playerVars.hasHeldTetromino = true;
        playSound(AUDIO.shift);
    };
};

function moveLeft() {
    if (tryMovement(-1, 0)) {
        playerVars.controlledTetrominoPositionX -= 1;
        if (!tryMovement(0, -1)) {
            extendControlledTetrominoLockDelay();
        };
        playSound(AUDIO.move);
    };
};

function moveRight() {
    if (tryMovement(1, 0)) {
        playerVars.controlledTetrominoPositionX += 1;
        if (!tryMovement(0, -1)) {
            extendControlledTetrominoLockDelay();
        };
        playSound(AUDIO.move);
    };
};

function rotateLeft() {
    const desiredRotation = mod(playerVars.controlledTetrominoRotation - 1, 4);
    const kickOffsetRules = playerVars.controlledTetrominoShape !== "i" ? "normal" : "modified";
    const kickOffsets = KICK_OFFSETS[kickOffsetRules][playerVars.controlledTetrominoRotation][-1];
    let lockDelayExtended = false;
    for (const kickOffset of kickOffsets) {
        if (tryMovement(kickOffset[0], kickOffset[1], desiredRotation)) {
            if (!lockDelayExtended && !tryMovement(0, -1)) {
                extendControlledTetrominoLockDelay();
            };
            playerVars.controlledTetrominoPositionX += kickOffset[0];
            playerVars.controlledTetrominoPositionY += kickOffset[1];
            playerVars.controlledTetrominoRotation = desiredRotation;
            if (!lockDelayExtended && !tryMovement(0, -1)) {
                extendControlledTetrominoLockDelay();
            };
            playSound(AUDIO.rotate);
            break;
        };
    };
};

function rotateRight() {
    const desiredRotation = mod(playerVars.controlledTetrominoRotation + 1, 4);
    const kickOffsetRules = playerVars.controlledTetrominoShape !== "i" ? "normal" : "modified";
    const kickOffsets = KICK_OFFSETS[kickOffsetRules][playerVars.controlledTetrominoRotation][1];
    let lockDelayExtended = false;
    for (const kickOffset of kickOffsets) {
        if (tryMovement(kickOffset[0], kickOffset[1], desiredRotation)) {
            if (!lockDelayExtended && !tryMovement(0, -1)) {
                extendControlledTetrominoLockDelay();
            };
            playerVars.controlledTetrominoPositionX += kickOffset[0];
            playerVars.controlledTetrominoPositionY += kickOffset[1];
            playerVars.controlledTetrominoRotation = desiredRotation;
            if (!lockDelayExtended && !tryMovement(0, -1)) {
                extendControlledTetrominoLockDelay();
            };
            playSound(AUDIO.rotate);
            break;
        };
    };
};

// Move the controlled tetromino 1 line down.
function softDrop() {
    if (tryMovement(0, -1)) {
        playerVars.controlledTetrominoPositionY -= 1;
        gameVars.score += 1;
    };
};

// Immediately move the controlled tetromino as far down as it can go and lock it in place.
function hardDrop() {
    let linesDropped = 0;
    while (tryMovement(0, -1)) {
        playerVars.controlledTetrominoPositionY -= 1;
        linesDropped++;
    };
    lockControlledPiece();
    gameVars.score += 2 * linesDropped;
};

// Check the playfield for filled lines.
// If a filled line is found, delete the line and shift all lines above it 1 line towards the ground.
// If a line clear threshold has been met, increase the level.
function scoreLines() {
    let clearedLines = 0;
    for (let row = 0; row < (PLAYFIELD_HEIGHT + PLAYFIELD_HEIGHT_BUFFER); row++) {
        let rowIsFilled = playfield.every(column => {
            return column[row];
        });
        while (rowIsFilled) {
            clearedLines++;
            for (let column = 0; column < playfield.length; column++) {
                playfield[column] = playfield[column].slice(0, row).concat(playfield[column].slice(row + 1, playfield[column].length), [null]);  
            };
            rowIsFilled = playfield.every(column => {
                return column[row];
            });
        };
    };
    if (clearedLines > 0) {
        if (clearedLines >= 4) { // If 4 lines are scored at once (tetris), play a special sound.
            playSound(AUDIO.tetris);
        } else {
            playSound(AUDIO.line);
        };
    };
    if (clearedLines === 1) {
        gameVars.score += 100 * gameVars.difficulty;
    };
    if (clearedLines === 2) {
        gameVars.score += 300 * gameVars.difficulty;
    };
    if (clearedLines === 3) {
        gameVars.score += 500 * gameVars.difficulty;
    };
    if (clearedLines >= 4) {
        gameVars.score += 800 * gameVars.difficulty;
    };
    gameVars.clearedLines += clearedLines;
    if (REQUIRED_LINES_PER_LEVEL[gameVars.difficulty + 1] && gameVars.clearedLines >= REQUIRED_LINES_PER_LEVEL[gameVars.difficulty + 1]) {
        gameVars.difficulty++;
        playSound(AUDIO.level);
    };
};

// Deal the randomized bag of 7 tetrominos by placing each of the 7 tetrominos in a "bag" and shuffling the bag.
function dealTetrominos() {
    gameVars.tetrominoBag = shuffleArray(["o", "i", "t", "l", "j", "s", "z"]);
};

// Shuffle array using the Fisher-Yates algorithm
function shuffleArray(array) {
    let currentIndex = array.length;
    let temp;
    let randomIndex;

    while (0 !== currentIndex) {
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex -= 1;
        temp = array[currentIndex];
        array[currentIndex] = array[randomIndex];
        array[randomIndex] = temp;
    };

    return array;
};

// Work-around for modulo operator operating as a remainder
function mod(n, mod) {
    return ((n % mod) + mod) % mod;
};

function playSound(sound) {
    if (sound.paused) {
        sound.play();
    } else {
        sound.currentTime = 0;
    };
};

function handleKeyStates() {
    for (const key in playerVars.keyStates) {
        if (playerVars.keyStates[key].pressed) {
            playerVars.keyStates[key].heldTicks++;
        } else {
            playerVars.keyStates[key].heldTicks = 0;
        };
    };
    const holdDelayTicks = 10;
    if (playerVars.keyStates["left"].heldTicks >= holdDelayTicks && (playerVars.keyStates["left"].heldTicks - holdDelayTicks) % 2 === 0) {
        moveLeft();
    };
    if (playerVars.keyStates["right"].heldTicks >= holdDelayTicks && (playerVars.keyStates["right"].heldTicks - holdDelayTicks) % 2 === 0) {
        moveRight();
    };
    if (playerVars.keyStates["down"].heldTicks >= holdDelayTicks) {
        softDrop();
    };
};

function handleKeyDown(event) {
    if (event.code === "Enter") {
        event.preventDefault();
        pauseGame();
        return;
    };
    if (!gameVars.active || gameVars.paused) {
        return;
    };
    switch (event.code) {
        case "KeyZ": {
            event.preventDefault();
            rotateLeft();
            break;
        };
        case "KeyX": {
            event.preventDefault();
            rotateRight();
            break;
        };
        case "KeyC": {
            event.preventDefault();
            holdTetromino();
            break;
        };
        case "ArrowLeft": {
            event.preventDefault();
            if (!playerVars.keyStates.left.pressed) {
                moveLeft();
            };
            playerVars.keyStates.left.pressed = true;
            break;
        };
        case "ArrowRight": {
            event.preventDefault();
            if (!playerVars.keyStates.right.pressed) {
                moveRight();
            };
            playerVars.keyStates.right.pressed = true;
            break;
        };
        case "ArrowDown": {
            event.preventDefault();
            if (!playerVars.keyStates.down.pressed) {
                softDrop();
            };
            playerVars.keyStates.down.pressed = true;
            break;
        };
        case "Space": {
            event.preventDefault();
            hardDrop();
            break;
        };
    };
    drawPlayField();
};

function handleKeyUp(event) {
    switch (event.code) {
        case "ArrowLeft": {
            playerVars.keyStates.left.pressed = false;
            break;
        };
        case "ArrowRight": {
            playerVars.keyStates.right.pressed = false;
            break;
        };
        case "ArrowDown": {
            playerVars.keyStates.down.pressed = false;
            break;
        };
    };
};

function handleClick() {
    if (!gameVars.active) {
        startGame();
    };
};

initialize();