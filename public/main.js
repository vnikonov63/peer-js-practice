const socket = io("/");
const videGrid = document.getElementById("video-grid");
const peer = new Peer(
  undefined
  // {
  //   secure: true,
  //   host: "vnikonov-63-peer.herokuapp.com",
  //   port: 443,
  // }
);

const myVideo = document.createElement("video");
myVideo.muted = true;

const peers = [];

navigator.mediaDevices
  .getUserMedia({
    video: { width: 300, height: 300 },
  })
  .then((stream) => {
    addVideoStream(myVideo, stream);

    peer.on("call", (call) => {
      call.answer(stream);
      const video = document.createElement("video");
      call.on("stream", (userVideoStream) => {
        addVideoStream(video, userVideoStream);
      });
    });

    socket.on("user-connected", (userId) => {
      connectToNewUser(userId, stream);
    });
  });

socket.on("user-disconnected", (userId) => {
  if (peers[userId]) peers[userId].close();
});

peer.on("open", (id) => {
  socket.emit("join-room", ROOM_ID, id);
});

// socket.on("user-connected", (userId) => {
//   console.log(`User ${userId} connected`);
// });

function connectToNewUser(userId, stream) {
  const call = peer.call(userId, stream);
  const video = document.createElement("video");
  call.on("stream", (userVideoStream) => {
    addVideoStream(video, userVideoStream);
  });
  call.on("close", () => {
    video.remove();
  });

  peers[userId] = call;
}

function addVideoStream(video, stream) {
  video.srcObject = stream;
  video.addEventListener("loadedmetadata", () => {
    video.play();
  });
  videGrid.append(video);
}
