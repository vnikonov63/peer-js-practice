const express = require("express");
const app = express();
const server = require("http").Server(app);
const io = require("socket.io")(server);
const { v4: uuidV4 } = require("uuid");
require("dotenv").config();

const { PeerServer } = require("peer");

const mongoose = require("mongoose");
mongoose.connect(process.env.MONGO, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

let session = require("express-session");

app.use(
  session({
    secret: "HelloWorld",
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false },
  })
);

app.use((req, res, next) => {
  console.log("SESSION:", req.session);
  next();
});

const peerServer = PeerServer({
  // host: "vnikonov-63-peer.herokuapp.com",
  // secure: true,
  // port: 443,
});

const port = process.env.PORT || 3000;

app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(express.urlencoded({ extended: false }));

app.get("/", (req, res) => {
  if (req.session.user) {
    res.redirect("/mafia");
  } else {
    res.redirect("/login");
  }
});

app.get("/login", (req, res) => {
  res.render("login");
});

app.post("/login", (req, res) => {
  const { email, password } = req.body;
  console.log(email, password);
});

app.get("/mafia", (req, res) => {
  res.render("layout", { roomId: "mafia" });
});

io.on("connection", (socket) => {
  socket.on("join-room", (roomId, userId) => {
    socket.join(roomId);
    socket.to(roomId).broadcast.emit("user-connected", userId);
    socket.on("disconnect", () => {
      socket.to(roomId).broadcast.emit("user-disconnected", userId);
    });
  });
});

server.listen(port, () => {
  console.log(`The server is listening on port ${port}`);
});
