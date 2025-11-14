const bigBoard = document.getElementById("big-board");
const message = document.getElementById("message");
const resetBtn = document.getElementById("resetBtn");
const winnerOverlay = document.getElementById("winner-overlay");

let currentPlayer = "X";
let boards = [];
let boardWinners = Array(9).fill(null);
let activeBoard = null; // which mini-board you must play in next

// Initialize game
function initGame() {
  bigBoard.innerHTML = "";
  boards = [];
  boardWinners.fill(null);
  currentPlayer = "X";
  activeBoard = null;
  winnerOverlay.classList.add("hidden");
  message.textContent = "Player X starts — play anywhere";

  for (let b = 0; b < 9; b++) {
    const mini = document.createElement("div");
    mini.className = "mini-board";
    mini.dataset.board = b;

    const cells = [];
    for (let c = 0; c < 9; c++) {
      const cell = document.createElement("div");
      cell.className = "cell";
      cell.dataset.board = b;
      cell.dataset.cell = c;
      cell.addEventListener("click", () => handleMove(b, c));
      mini.appendChild(cell);
      cells.push(cell);
    }

    bigBoard.appendChild(mini);
    boards.push({ element: mini, cells, state: Array(9).fill(null) });
  }
}
initGame();

resetBtn.addEventListener("click", initGame);

function handleMove(b, c) {
  const board = boards[b];
  if (boardWinners[b] || board.state[c]) return;
  if (activeBoard !== null && activeBoard !== b) return;

  board.state[c] = currentPlayer;
  const cell = board.cells[c];
  cell.textContent = currentPlayer;
  cell.classList.add("taken");

  const miniWin = checkWin(board.state);
  if (miniWin) {
    boardWinners[b] = miniWin;
    board.element.innerHTML = `<div class="mini-winner" style="color:${
      miniWin === "X" ? "var(--x-color)" : "var(--o-color)"
    }">${miniWin}</div>`;
  } else if (board.state.every(Boolean)) {
    boardWinners[b] = "T"; // Tie
    board.element.style.opacity = 0.5;
  }

  const bigWin = checkWin(boardWinners);
  if (bigWin) {
    showWinner(bigWin);
    return;
  }

  // Next active board
  activeBoard = c;
  if (boardWinners[activeBoard]) activeBoard = null; // if full/won, free choice

  updateHighlights();

  currentPlayer = currentPlayer === "X" ? "O" : "X";
  message.textContent = `Player ${currentPlayer}'s turn${
    activeBoard === null ? " — play anywhere" : ` — board ${activeBoard + 1}`
  }`;
}

function checkWin(state) {
  const wins = [
    [0,1,2],[3,4,5],[6,7,8],
    [0,3,6],[1,4,7],[2,5,8],
    [0,4,8],[2,4,6]
  ];
  for (const [a,b,c] of wins) {
    if (state[a] && state[a] === state[b] && state[a] === state[c]) {
      return state[a];
    }
  }
  return null;
}

function updateHighlights() {
  boards.forEach((b, i) => {
    b.element.classList.remove("highlight");
    if (activeBoard === null && !boardWinners[i]) b.element.classList.add("highlight");
    if (activeBoard === i) b.element.classList.add("highlight");
  });
}

function showWinner(winner) {
  winnerOverlay.textContent = `${winner} Wins!`;
  winnerOverlay.classList.remove("hidden");
}
