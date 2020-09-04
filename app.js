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

const User = require("./models/user.js");

let session = require("express-session");
const { request } = require("http");
const sessionParser = session({
  secret: "HelloWorld",
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false },
});

io.use(function (socket, next) {
  sessionParser(socket.request, socket.request.res, next);
});

app.use(sessionParser);

app.use((req, res, next) => {
  console.log("SESSION:", req.session);
  next();
});

const peerServer = PeerServer({
  // host: "vnikonov-63-peer.herokuapp.com",
  // secure: true,
  // port: 443,
});

function checkAuthSession(req, res, next) {
  if (req.session.user) {
    next();
  } else {
    res.redirect("/login");
  }
}

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

app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const user = await User.find({ email: email });
  if (user[0]) {
    if (user[0].email === "admin") {
      if (user[0].password === password) {
        req.session.user = "admin";
      }
    } else {
      if (user[0].password === password) {
        req.session.user = "user";
        res.redirect("/mafia");
      } else {
        res.redirect("/login");
      }
    }
  } else {
    res.redirect("/login");
  }
});

app.get("/mafia", checkAuthSession, (req, res) => {
  res.render("layout", { roomId: "mafia", userStatus: req.session.user });
});

app.get("/userStatus", checkAuthSession, (req, res) => {
  res.send(req.session.user);
});

io.on("connection", function (socket) {
  // if (!socket.request.user) {
  //   socket.disconnect();
  // } else {
  socket.emit("userStatus", socket.request.session.user);
  socket.on("join-room", (roomId, userId) => {
    socket.join(roomId);
    socket.to(roomId).broadcast.emit("user-connected", {
      userId: userId,
      userStatus: socket.request.session.user,
    });
    socket.on("disconnect", () => {
      socket.to(roomId).broadcast.emit("user-disconnected", userId);
    });
  });
  // }
});

server.listen(port, () => {
  console.log(`The server is listening on port ${port}`);
});
