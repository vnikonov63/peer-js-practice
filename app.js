const express = require("express");
const app = express();
const server = require("http").Server(app);
const io = require("socket.io")(server);
const { v4: uuidV4 } = require("uuid");

const { PeerServer } = require("peer");

const peerServer = PeerServer({
  // host: "9000-c60ae333-4b0c-46b0-9ecf-0c8f7012d89f.ws-eu01.gitpod.io",
  // secure: true,
  // port: 443,
  // path: "/myapp",
});

const port = 3000 || process.env.PORT;

app.set("view engine", "ejs");
app.use(express.static("public"));

app.get("/", (req, res) => {
  res.redirect(`/${uuidV4()}`);
});

app.get("/:room", (req, res) => {
  res.render("layout", { roomId: req.params.room });
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
