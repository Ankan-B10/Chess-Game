// const { Chess } = require("chess.js");
// const { render } = require("ejs");

//Basic soket io setup
const socket = io(); //frontend run this line -> automatic request to setup

// socket.emit("ankan"); // emit means fekna/through

// socket.on("ankan bera everyone", function () { //get all msg from backend to fronted
// 	console.log("ankan bera received");
// });

const chess = new Chess();
const boardElement = document.querySelector(".chessboard");

let draggedPiece = null;
let sourceSquare = null;
let playerRole = null;

const renderBoard = () => {
	const board = chess.board();
	boardElement.innerHTML = "";
	// console.log(board);
	board.forEach((row, rowindex) => {
		// console.log(row, rowindex);
		row.forEach((square, squareindex) => {
			//chessboard pattern checked ->
			const squareElement = document.createElement("div");
			squareElement.classList.add(
				"square",
				(rowindex + squareindex) % 2 === 0 ? "light" : "dark"
			);

			squareElement.dataset.row = rowindex;
			squareElement.dataset.col = squareindex;

			//piece element is present or not
			if (square) {
				const pieceElement = document.createElement("div");
				pieceElement.classList.add(
					"piece",
					square.color === "w" ? "white" : "black"
				);
				pieceElement.innerText = getPieceUnicode(square); //send every pieces from getPiece
				//one player only dragable one
				pieceElement.draggable = playerRole === square.color;

				pieceElement.addEventListener("dragstart", (e) => {
					if (pieceElement.draggable) {
						draggedPiece = pieceElement;
						sourceSquare = { row: rowindex, col: squareindex }; //tell and check the paths of piece
						e.dataTransfer.setData("text/plain", ""); // to solve drag problem
					}
				});

				pieceElement.addEventListener("dragend", (e) => {
					draggedPiece = null;
					sourceSquare = null;
				});

				squareElement.appendChild(pieceElement);
			}

			squareElement.addEventListener("dragover", function (e) {
				e.preventDefault();
			});
			//piece drop to square
			squareElement.addEventListener("drop", function (e) {
				e.preventDefault();
				if (draggedPiece) {
					const targetSource = {
						row: parseInt(squareElement.dataset.row),
						col: parseInt(squareElement.dataset.col),
					};
					handleMove(sourceSquare, targetSource);
				}
			});
			// squareElement.addEventListener("drop", function (e) {});
			boardElement.appendChild(squareElement);
		});
	});

	//flip board for new one
	if (playerRole === "b") {
		boardElement.classList.add("flipped");
	} else {
		boardElement.classList.remove("flipped");
	}
};

const handleMove = (source, target) => {
	const move = {
		from: `${String.fromCharCode(97 + source.col)}${8 - source.row}`,
		to: `${String.fromCharCode(97 + target.col)}${8 - target.row}`,
		promotion: "q",
	};

	socket.emit("move", move);
};

const getPieceUnicode = (piece) => {
	const unicodePieces = {
		p: "♙",
		r: "♜",
		n: "♞",
		b: "♝",
		q: "♛",
		k: "♚",
		P: "♙",
		R: "♖",
		N: "♘",
		B: "♗",
		Q: "♕",
		K: "♔",
	};

	return unicodePieces[piece.type] || "";
};

//backend connects ->
socket.on("playerRole", function (role) {
	playerRole = role;
	renderBoard();
});

//Spectator Role
socket.on("spectatorRole", function () {
	playerRole = null;
	renderBoard();
});

socket.on("boardState", function (fen) {
	chess.load(fen);
	renderBoard();
});

//move the pieces
socket.on("move", function (move) {
	chess.load(move);
	renderBoard();
});

renderBoard();
