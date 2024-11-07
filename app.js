const express = require("express");
const socket = require("socket.io");
const http = require("http");
const {Chess} = require("chess.js");
const path = require("path");
const { log } = require("console");

const app = express();
const server = http.createServer(app);
const io = socket(server);

const chess = new Chess();
let players = {};
let currentPlayer = "w"

app.set("view engine","ejs");
app.use(express.static(path.join(__dirname,"public")));

app.get("/",(req,res)=>{
    res.render("index",{title: "Jhess - Multiplayer Chess Platform"});
});

io.on("connection",function(uniquesocket){
    console.log("Connected");

    if(!players.white){
        players.white = uniquesocket.id;
        uniquesocket.emit("playerRole","w");
    }
    else if(!players.black){
        players.black = uniquesocket.id;
        uniquesocket.emit("playerRole","b");
    }
    else{
        uniquesocket.emit("Spectator");
    }

    uniquesocket.on("disconnect",function(){
        if(uniquesocket.id === players.white){
            delete players.white;
        }
        else if(uniquesocket.id === players.white){
            delete players.black;
        }
    })

    uniquesocket.on("move",(move)=>{
        try {
           if(chess.turn()=== "w" && uniquesocket.id !== players.white) return;
           if(chess.turn()=== "b" && uniquesocket.id !== players.black) return;

           const result = chess.move(move);
           if(result){
            currentPlayer = chess.turn();
            io.emit("move",move);
            io.emit("boardState",chess.fen())
           }
           else{
            console.log("invalid move :",move);
            uniquesocket.emit("inavalidMove",move)
           }
        } catch (err) {
            console.log(err)
            uniquesocket.emit("inavalid Move :",move)
        }
    })
});

// Example: server.js
let timers = {
    white: 300,  // 5 minutes for white (in seconds)
    black: 300,  // 5 minutes for black (in seconds)
};

let currentTurn = 'w'; // 'w' for white, 'b' for black

const countdown = () => {
    if (currentTurn === 'w') {
        timers.white--;
    } else {
        timers.black--;
    }

    io.emit('timerUpdate', timers); // Send the updated timer to both players

    if (timers.white <= 0 || timers.black <= 0) {
        io.emit('gameOver', currentTurn === 'w' ? 'black' : 'white');
    }
};

setInterval(countdown, 1000); // Update the timer every second

io.on('move', (move) => {
    chess.move(move);
    currentTurn = currentTurn === 'w' ? 'b' : 'w'; // Switch turns
    io.emit('move', move);
});


server.listen(3000,() => {
    console.log("listening");
});
