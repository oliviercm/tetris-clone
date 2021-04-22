const canvas = document.getElementById("game-canvas");
const context = canvas.getContext("2d");

// Define core gameplay variables
const BOARD_WIDTH = 8;
const BOARD_HEIGHT = 8;
const CELL_WIDTH = canvas.width / BOARD_WIDTH;
const CELL_HEIGHT = canvas.height / BOARD_HEIGHT;
const PIECE_IMAGES = {
    k: {
        l: "./svg/Chess_kl.svg",
        d: "./svg/Chess_kd.svg",
    },
    q: {
        l: "./svg/Chess_ql.svg",
        d: "./svg/Chess_qd.svg",
    },
    r: {
        l: "./svg/Chess_rl.svg",
        d: "./svg/Chess_rd.svg",
    },
    b: {
        l: "./svg/Chess_bl.svg",
        d: "./svg/Chess_bd.svg",
    },
    n: {
        l: "./svg/Chess_nl.svg",
        d: "./svg/Chess_nd.svg",
    },
    p: {
        l: "./svg/Chess_pl.svg",
        d: "./svg/Chess_pd.svg",
    },
};
const DIRECTION_OFFSETS = [-9, -8, -7, -1, 1, 7, 8, 9];
const DIRECTION_INDEXES = {
    [-9]: 4,
    [-8]: 0,
    [-7]: 5,
    [-1]: 2,
    [1]: 3,
    [7]: 6,
    [8]: 1,
    [9]: 7,
};
let NUM_CELLS_TO_EDGE = [];

const board = [
    "rd", "nd", "bd", "qd", "kd", "bd", "nd", "rd",
    "pd", "pd", "pd", "pd", "pd", "pd", "pd", "pd",
    "", "", "", "", "", "", "", "",
    "", "", "", "", "", "", "", "",
    "", "", "", "", "", "", "", "",
    "", "", "", "", "", "", "", "",
    "pl", "pl", "pl", "pl", "pl", "pl", "pl", "pl",
    "rl", "nl", "bl", "ql", "kl", "bl", "nl", "rl",
];

const playerVars = {
    selectedCell: null,
    selectedPiece: null,
};

async function initialize() {
    await Promise.all(initializePieceImages());
    computeNumberOfCellsToEdges();
    drawBoard();
};

function initializePieceImages() {
    const promises = [];
    for (const piece in PIECE_IMAGES) {
        for (const color in PIECE_IMAGES[piece]) {
            promises.push(new Promise((resolve, reject) => {
                const img = new Image(CELL_WIDTH, CELL_HEIGHT);
                img.onload = function() {
                    resolve();
                };
                img.src = PIECE_IMAGES[piece][color];

                PIECE_IMAGES[piece][color] = img;
            }));
        };
    };
    return promises;
};

function computeNumberOfCellsToEdges() {
    for (let column = 0; column < 8; column++) {
        for (let row = 0; row < 8; row++) {
            const north = row;
            const south = 7 - row;
            const west = column;
            const east = 7 - column;

            NUM_CELLS_TO_EDGE[row * 8 + column] = [
                north,
                south,
                west,
                east,
                Math.min(north, west),
                Math.min(north, east),
                Math.min(south, west),
                Math.min(south, east),
            ];
        };
    };
};

function drawBoard() {
    context.clearRect(0, 0, canvas.width, canvas.height);
    drawCells();
    drawSelectedCell();
    drawValidMoves();
    drawPieces();
};

function drawCells() {
    for (let x = 0; x < BOARD_WIDTH; x++) {
        for (let y = 0; y < BOARD_HEIGHT; y++) {
            drawCell(x, y);
        };
    };
};

function drawCell(x, y) {
    context.fillStyle = (x + y) % 2 ? "rgba(181,136,99,255)" : "rgba(240,217,181,255)"; // dark, light
    context.fillRect(CELL_WIDTH * x, CELL_HEIGHT * y, CELL_WIDTH, CELL_HEIGHT);
};

function drawValidCell(cell) {
    const x = cell % 8;
    const y = Math.trunc(cell / 8);
    context.fillStyle = (x + y) % 2 ? "rgba(255,255,255,255)" : "rgba(255,255,255,255)"; // dark, light
    context.fillRect(CELL_WIDTH * x, CELL_HEIGHT * y, CELL_WIDTH, CELL_HEIGHT);
};

function drawSelectedCell() {
    if (playerVars.selectedCell !== null) {
        const x = playerVars.selectedCell % 8;
        const y = Math.trunc(playerVars.selectedCell / 8);
        context.fillStyle = (x + y) % 2 ? "rgba(100,111,64,255)" : "rgba(130,151,105,255)"; // dark, light
        context.fillRect(CELL_WIDTH * x, CELL_HEIGHT * y, CELL_WIDTH, CELL_HEIGHT);
    };
};

function drawPieces() {
    for (let i = 0; i < board.length; i++) {
        if (board[i]) {
            drawPiece(board[i][0], board[i][1], i % 8, Math.trunc(i / 8));
        };
    };
};

function drawPiece(piece, color, x, y) {
    context.drawImage(PIECE_IMAGES[piece][color], x * CELL_WIDTH, y * CELL_HEIGHT);
};

function getCursorPosition(canvas, event) {
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    return {
        x: x,
        y: y,
    };
};

function getCursorCellPosition(canvas, event) {
    const pos = getCursorPosition(canvas, event);

    return {
        x: Math.trunc(pos.x / CELL_WIDTH),
        y: Math.trunc(pos.y / CELL_HEIGHT),
    };
};

function getCursorCellIndex(canvas, event) {
    const pos = getCursorCellPosition(canvas, event);

    return pos.y * 8 + pos.x;
};

function getValidMoves(index) {
    const validMoves = [];

    const piece = board[index][0];
    const color = board[index][1];
    switch (piece) {
        case "k": {
            const possibleOffsets = [-9, -8, -7, -1, 1, 7, 8, 9];
            for (const offset of possibleOffsets) {
                const offsetIndex = index + offset;
                if (0 <= offsetIndex && offsetIndex < 64 && board[offsetIndex][1] !== color) {
                    validMoves.push(offsetIndex);
                };
            };
            break;
        };
        case "q": {
            const dirs = [-9, -8, -7, -1, 1, 7, 8, 9];
            for (const dir of dirs) {
                let currentIndex = index + dir;
                let numCellsToEdge = NUM_CELLS_TO_EDGE[index][DIRECTION_INDEXES[dir]];
                while (numCellsToEdge > 0) {
                    if (board[currentIndex]) {
                        if (board[currentIndex][1] === color) {
                            break;
                        } else {
                            validMoves.push(currentIndex);
                            break;
                        };
                    } else {
                        validMoves.push(currentIndex);
                    };
                    currentIndex += dir;
                    numCellsToEdge -= 1;
                };
            };
            break;
        };
        case "r": {
            const dirs = [-8, -1, 1, 8];
            for (const dir of dirs) {
                let currentIndex = index + dir;
                let numCellsToEdge = NUM_CELLS_TO_EDGE[index][DIRECTION_INDEXES[dir]];
                while (numCellsToEdge > 0) {
                    if (board[currentIndex]) {
                        if (board[currentIndex][1] === color) {
                            break;
                        } else {
                            validMoves.push(currentIndex);
                            break;
                        };
                    } else {
                        validMoves.push(currentIndex);
                    };
                    currentIndex += dir;
                    numCellsToEdge -= 1;
                };
            };
            break;
        };
        case "b": {
            const dirs = [-9, -7, 7, 9];
            for (const dir of dirs) {
                let currentIndex = index + dir;
                let numCellsToEdge = NUM_CELLS_TO_EDGE[index][DIRECTION_INDEXES[dir]];
                while (numCellsToEdge > 0) {
                    if (board[currentIndex]) {
                        if (board[currentIndex][1] === color) {
                            break;
                        } else {
                            validMoves.push(currentIndex);
                            break;
                        };
                    } else {
                        validMoves.push(currentIndex);
                    };
                    currentIndex += dir;
                    numCellsToEdge -= 1;
                };
            };
            break;
        };
        case "n": {
            const possibleOffsets = [-17, -15, -10, -6, 6, 10, 15, 17];
            for (const offset of possibleOffsets) {
                const offsetIndex = index + offset;
                if (0 <= offsetIndex && offsetIndex < 64 && board[offsetIndex][1] !== color) {
                    validMoves.push(offsetIndex);
                };
            };
            break;
        };
    };
    return validMoves;
};

function drawValidMoves() {
    if (playerVars.selectedCell !== null) {
        const validMoves = getValidMoves(playerVars.selectedCell);
        for (const cell of validMoves) {
            drawValidCell(cell);
        };
    };
};

canvas.addEventListener("mousedown", function(event) {
    const clickedCell = getCursorCellIndex(canvas, event);
    console.log(clickedCell);
    const clickedPiece = board[clickedCell];
    if (playerVars.selectedPiece) {
        board[playerVars.selectedCell] = "";
        board[clickedCell] = playerVars.selectedPiece;
        playerVars.selectedPiece = null;
        playerVars.selectedCell = null;
    } else {
        playerVars.selectedCell = clickedCell;
        playerVars.selectedPiece = clickedPiece;
    };
    
    drawBoard();
});

initialize();