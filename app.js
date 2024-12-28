const express = require("express");
const socket = require("socket.io");
const http = require("http");
const { Chess } = require("chess.js");
const path = require("path");
const { title } = require("process");
const res = require("express/lib/response");
const { log } = require("console");

const app = express();

//socket io documentation
const server = http.createServer(app);
const io = socket(server);

const chess = new Chess();

let players = {};
let currentPlayer = "W";

app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
	res.render("index", { title: "Chess Game" });
});

io.on("connection", function (uniquesocket) {
	//callback on client connect
	console.log("connected");

	//when frontend and backend breaks, uniquesocket disconnect before it
	// uniquesocket.on("disconnect", function () {
	// 	console.log("disconnected");
	// });
	// uniquesocket.on("ankan", function(){
	//     // console.log("ankan received");
	//     io.emit("ankan bera everyone");  //backend give to everyone
	// });

	if (!players.white) {
		players.white = uniquesocket.id;
		uniquesocket.emit("playerRole", "w"); //response back who is connected
	} else if (!players.black) {
		players.black = uniquesocket.id;
		uniquesocket.emit("playerRole", "b");
	} else {
		uniquesocket.emit("spectatorRole");
	}

	uniquesocket.on("disconnect", function () {
		// if anyone get disconnected
		if (uniquesocket.id === players.white) {
			delete players.white;
		} else if (uniquesocket.id === players.black) {
			delete players.black;
		}
	});

	uniquesocket.on("move", (move) => {
		try {
			//this tell if anyone move is active others cannot  move
			if (chess.turn() === "w" && uniquesocket.id !== players.white) return;
			if (chess.turn() === "b" && uniquesocket.id !== players.black) return;

			//update game states
			const result = chess.move(move);
			if (result) {
				currentPlayer = chess.turn();
				io.emit("move", move);
				io.emit("boardState", chess.fen());
			} else {
				console.log("Invalid move : ", move);
				uniquesocket.emit("InvalidMove", move);
			}
		} catch (err) {
			console.log(err);
			uniquesocket.emit("Invalid move: ", move);
		}
	});
});

//server call
server.listen(3080, function () {
	console.log("listening on port 3080");
});
