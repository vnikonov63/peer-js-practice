const socket = io("/");
const videGrid = document.getElementById("video-grid");
const peer = new Peer(undefined);

const myVideo = document.createElement("video");
myVideo.muted = true;

const peers = [];
let userCount = 1;

navigator.mediaDevices
  .getUserMedia({
    video: { width: 150, height: 150 },
  })
  .then((stream) => {
    addVideoStream(myVideo, stream);

    peer.on("call", (call) => {
      call.answer(stream);
      const video = document.createElement("video");
      call.on("stream", (userVideoStream) => {
        if (userCount < 4) {
          addMyVideoStream(video, userVideoStream);
        }
      });
    });

    socket.on("user-connected", ({ userId, userStatus }) => {
      console.log(
        `User with id ${userId} connected with status of ${userStatus}`
      );
      userCount += 1;
      if (userCount < 4) {
        connectToNewUser(userId, stream);
      }
    });
  });

socket.on("user-disconnected", (userId) => {
  if (peers[userId]) peers[userId].close();
});

peer.on("open", (id) => {
  socket.emit("join-room", ROOM_ID, id);
});

function connectToNewUser(userId, stream) {
  const call = peer.call(userId, stream);
  const video = document.createElement("video");
  video.className += "margin";
  call.on("stream", (userVideoStream) => {
    addMyVideoStream(video, userVideoStream);
  });
  call.on("close", () => {
    video.remove();
  });

  peers[userId] = call;
}

let userStatus;

function addMyVideoStream(video, stream) {
  video.srcObject = stream;
  video.addEventListener("loadedmetadata", () => {
    video.play();
  });
  let myDiv = document.createElement("div");
  let p = document.createElement("p");
  p.innerHTML = USER_STATUS;
  p.style = "text-align: center";
  myDiv.append(p);
  myDiv.append(video);
  console.log(myDiv);
  videGrid.append(myDiv);
}

function addVideoStream(video, stream) {
  video.srcObject = stream;
  video.addEventListener("loadedmetadata", () => {
    video.play();
  });
  let myDiv = document.createElement("div");
  let p = document.createElement("p");
  p.innerHTML = "myVideo";
  p.style = "text-align: center";
  myDiv.append(p);
  myDiv.append(video);
  console.log(myDiv);
  videGrid.append(myDiv);
}
