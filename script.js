const canvas = document.getElementById("game-canvas");
const context = canvas.getContext("2d");

// Define core gameplay constants
const PLAYFIELD_WIDTH = 10;
const PLAYFIELD_HEIGHT = 20;
const PLAYFIELD_HEIGHT_BUFFER = 20;
const CELL_WIDTH = canvas.width / PLAYFIELD_WIDTH;
const CELL_HEIGHT = canvas.height / PLAYFIELD_HEIGHT;
const TETROMINO_COLORS = {
    o: "rgba(255, 255, 0, 255)",
    i: "rgba(0, 255, 255, 255)",
    t: "rgba(128, 0, 128, 255)",
    l: "rgba(255, 165, 0, 255)",
    j: "rgba(0, 0, 139, 255)",
    s: "rgba(0, 128, 0, 255)",
    z: "rgba(255, 0, 0, 255)",
};
const TETROMINOS = {
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
const KICK_OFFSETS = {
    normal: {
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
    modified: {
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
};

const gameVars = {
    active: false,
    gameOver: false,
    globalTick: 0,
    difficulty: 0,
    tetrominoBag: [],
};

const playerVars = {
    controlledTetrominoShape: null,
    controlledTetrominoPositionX: null,
    controlledTetrominoPositionY: null,
    controlledTetrominoRotation: null,
    controlledTetrominoLockDelay: null,
    controlledTetrominoLockDelayExtensions: null,
};

// Initialize playfield matrix (stores position of cells)
let playfield = Array(PLAYFIELD_WIDTH).fill().map(() => Array(PLAYFIELD_HEIGHT + PLAYFIELD_HEIGHT_BUFFER).fill(null));

function initialize() {
    drawMenu();
    document.addEventListener("keydown", handleKeydown);
    canvas.addEventListener("click", handleClick);
    setInterval(tick, 1000 / 30);
};

function drawMenu() {
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.textAlign = "center";
    context.font = "bold 24px sans-serif";
    context.fillText("Click anywhere to begin.", canvas.width / 2, canvas.height / 2);
};

function startGame() {
    gameVars.active = true;
    gameVars.gameOver = false;

    initializePlayfield();
    drawPlayField();
    dealTetrominos();
    createControlledTetromino();
    playTheme();
};

function tick() {
    if (gameVars.active) {
        gameVars.globalTick += 1;
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
    if (gameVars.gameOver) {
        context.fillStyle = "black";
        context.textAlign = "center";
        context.font = "bold 40px sans-serif";
        context.fillText("GAME OVER!", canvas.width / 2, canvas.height / 2);
        context.font = "bold 24px sans-serif";
        context.fillText("Click anywhere to restart.", canvas.width / 2, canvas.height / 2 + 40);
    };
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
    // context.fillStyle = "gray";
    // context.globalAlpha = 0.3;
    // context.fillRect(CELL_WIDTH * x + 16, CELL_HEIGHT * (PLAYFIELD_HEIGHT - y - 1) + 16, CELL_WIDTH - 32, CELL_HEIGHT - 32);
    // context.globalAlpha = 1;
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

function playTheme() {
    AUDIO.theme.currentTime = 0;
    AUDIO.theme.loop = true;
    AUDIO.theme.play();
};

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

function createControlledTetromino() {
    const tetromino = gameVars.tetrominoBag.pop();
    if (gameVars.tetrominoBag.length <= 0) {
        dealTetrominos();
    };
    playerVars.controlledTetrominoShape = tetromino;
    playerVars.controlledTetrominoRotation = 0;
    playerVars.controlledTetrominoPositionX = Math.trunc(((PLAYFIELD_WIDTH - 1) / 2) - 1);
    playerVars.controlledTetrominoPositionY = PLAYFIELD_HEIGHT - 1;
    playerVars.controlledTetrominoLockDelay = 30 - gameVars.difficulty;
    playerVars.controlledTetrominoLockDelayExtensions = 0;
    if (!tryMovement(0, 0)) {
        gameOver();
    };
};

function extendControlledTetrominoLockDelay() {
    playerVars.controlledTetrominoLockDelay += Math.max(0, 20 - gameVars.difficulty - (playerVars.controlledTetrominoLockDelayExtensions * 2));
    playerVars.controlledTetrominoLockDelayExtensions += 1;
};

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

function tetrominoGravity() {
    if (tryMovement(0, -1)) {
        if (gameVars.globalTick % Math.max(20 - gameVars.difficulty, 1) === 0) {
            playerVars.controlledTetrominoPositionY -= 1;
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
    }, 500);
    AUDIO.theme.pause();
};

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
};

function scoreLines() {
    let score = 0;
    for (let row = 0; row < (PLAYFIELD_HEIGHT + PLAYFIELD_HEIGHT_BUFFER); row++) {
        let rowIsFilled = playfield.every(column => {
            return column[row];
        });
        while (rowIsFilled) {
            score++;
            for (let column = 0; column < playfield.length; column++) {
                playfield[column] = playfield[column].slice(0, row).concat(playfield[column].slice(row + 1, playfield[column].length), [null]);  
            };
            rowIsFilled = playfield.every(column => {
                return column[row];
            });
        };
    };
    if (score > 0) {
        if (score >= 4) {
            playSound(AUDIO.tetris);
        } else {
            playSound(AUDIO.line);
        };
        
    };
};

function dealTetrominos() {
    gameVars.tetrominoBag = shuffleArray(["o", "i", "t", "l", "j", "s", "z"]);
};

function hardDrop() {
    while (tryMovement(0, -1)) {
        playerVars.controlledTetrominoPositionY -= 1;
    };
    lockControlledPiece();
};

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

function handleKeydown(event) {
    if (!gameVars.active) {
        return;
    };
    switch (event.code) {
        case "KeyZ": {
            event.preventDefault();
            const desiredRotation = mod(playerVars.controlledTetrominoRotation - 1, 4);
            const kickOffsetRules = playerVars.controlledTetrominoShape !== "i" ? "normal" : "modified";
            const kickOffsets = KICK_OFFSETS[kickOffsetRules][playerVars.controlledTetrominoRotation][-1];
            const kickingFromGround = !tryMovement(0, -1);
            for (const kickOffset of kickOffsets) {
                if (tryMovement(kickOffset[0], kickOffset[1], desiredRotation)) {
                    playerVars.controlledTetrominoPositionX += kickOffset[0];
                    playerVars.controlledTetrominoPositionY += kickOffset[1];
                    playerVars.controlledTetrominoRotation = desiredRotation;
                    if (kickingFromGround) {
                        extendControlledTetrominoLockDelay();
                    };
                    playSound(AUDIO.rotate);
                    break;
                };
            };
            break;
        };
        case "KeyX": {
            event.preventDefault();
            const desiredRotation = mod(playerVars.controlledTetrominoRotation + 1, 4);
            const kickOffsetRules = playerVars.controlledTetrominoShape !== "i" ? "normal" : "modified";
            const kickOffsets = KICK_OFFSETS[kickOffsetRules][playerVars.controlledTetrominoRotation][1];
            const kickingFromGround = !tryMovement(0, -1);
            for (const kickOffset of kickOffsets) {
                if (tryMovement(kickOffset[0], kickOffset[1], desiredRotation)) {
                    playerVars.controlledTetrominoPositionX += kickOffset[0];
                    playerVars.controlledTetrominoPositionY += kickOffset[1];
                    playerVars.controlledTetrominoRotation = desiredRotation;
                    if (kickingFromGround) {
                        extendControlledTetrominoLockDelay();
                    };
                    playSound(AUDIO.rotate);
                    break;
                };
            };
            break;
        };
        case "ArrowLeft": {
            event.preventDefault();
            if (tryMovement(-1, 0)) {
                playerVars.controlledTetrominoPositionX -= 1;
                playSound(AUDIO.move);
            };
            break;
        };
        case "ArrowRight": {
            event.preventDefault();
            if (tryMovement(1, 0)) {
                playerVars.controlledTetrominoPositionX += 1;
                playSound(AUDIO.move);
            };
            break;
        };
        case "ArrowDown": {
            event.preventDefault();
            if (tryMovement(0, -1)) {
                playerVars.controlledTetrominoPositionY -= 1;
            };
            break;
        };
        // case "ArrowUp": {
        //     event.preventDefault();
        //     if (tryMovement(0, 1)) {
        //         playerVars.controlledTetrominoPositionY += 1;
        //     };
        //     break;
        // };
        case "Space": {
            event.preventDefault();
            hardDrop();
            break;
        };
    };
    drawPlayField();
};

function handleClick() {
    if (!gameVars.active) {
        startGame();
    };
};

initialize();