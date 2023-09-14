// Initialize Socket.io connection to the server
const socket = io("/");

// Get a reference to the video grid container in the HTML
const videoGrid = document.getElementById("video-grid");

// Initialize Peer for WebRTC communication
const myPeer = new Peer(undefined, {
  path: "/peerjs", // Path for Peer.js server
  host: "/", // Host for Peer.js server
  port: "443", // Port for Peer.js server
});

let myVideoStream; // Store the user's video stream
const myVideo = document.createElement("video"); // Create a video element for the user's video
myVideo.muted = true; // Mute the user's video

// Store references to peer connections
const peers = {};

// Request access to the user's webcam and microphone
navigator.mediaDevices
  .getUserMedia({
    video: true,
    audio: true,
  })
  .then((stream) => {
    myVideoStream = stream;

    // Add the user's video stream to the page
    addVideoStream(myVideo, stream);

    // Handle incoming calls from other users
    myPeer.on("call", (call) => {
      call.answer(stream);
      const video = document.createElement("video");
      call.on("stream", (userVideoStream) => {
        addVideoStream(video, userVideoStream);
      });
    });

    // Listen for 'user-connected' event from the server
    socket.on("user-connected", (userId) => {
      connectToNewUser(userId, stream);
    });

    // Handle text chat input
    let text = $("input");

    // Send a message when the user presses Enter
    $("html").keydown(function (e) {
      if (e.which == 13 && text.val().length !== 0) {
        socket.emit("message", text.val());
        text.val("");
      }
    });

    // Display incoming messages in the chat window
    socket.on("createMessage", (message) => {
      $("ul").append(`<li class="message"><b>user</b><br/>${message}</li>`);
      scrollToBottom();
    });
  });

// Handle 'user-disconnected' event
socket.on("user-disconnected", (userId) => {
  if (peers[userId]) peers[userId].close();
});

// When the Peer connection is open, emit a 'join-room' event to the server
myPeer.on("open", (id) => {
  socket.emit("join-room", ROOM_ID, id);
});

// Function to establish a connection with a new user
function connectToNewUser(userId, stream) {
  const call = myPeer.call(userId, stream);
  const video = document.createElement("video");
  call.on("stream", (userVideoStream) => {
    addVideoStream(video, userVideoStream);
  });
  call.on("close", () => {
    video.remove();
  });

  // Store the call in the peers object
  peers[userId] = call;
}

// Function to add a video stream to the video grid
function addVideoStream(video, stream) {
  video.srcObject = stream;
  video.addEventListener("loadedmetadata", () => {
    video.play();
  });
  videoGrid.append(video);
}

// Function to scroll the chat window to the bottom
const scrollToBottom = () => {
  var d = $(".main__chat_window");
  d.scrollTop(d.prop("scrollHeight"));
};

// Functions to mute/unmute audio and start/stop video
const muteUnmute = () => {
  const enabled = myVideoStream.getAudioTracks()[0].enabled;
  if (enabled) {
    myVideoStream.getAudioTracks()[0].enabled = false;
    setUnmuteButton();
  } else {
    setMuteButton();
    myVideoStream.getAudioTracks()[0].enabled = true;
  }
};

const playStop = () => {
  let enabled = myVideoStream.getVideoTracks()[0].enabled;
  if (enabled) {
    myVideoStream.getVideoTracks()[0].enabled = false;
    setPlayVideo();
  } else {
    setStopVideo();
    myVideoStream.getVideoTracks()[0].enabled = true;
  }
};

// Functions to update UI buttons for audio and video
const setMuteButton = () => {
  const html = `
    <i class="fas fa-microphone"></i>
    <span>Mute</span>
  `;
  document.querySelector(".main__mute_button").innerHTML = html;
};

const setUnmuteButton = () => {
  const html = `
    <i class="unmute fas fa-microphone-slash"></i>
    <span>Unmute</span>
  `;
  document.querySelector(".main__mute_button").innerHTML = html;
};

const setStopVideo = () => {
  const html = `
    <i class="fas fa-video"></i>
    <span>Stop Video</span>
  `;
  document.querySelector(".main__video_button").innerHTML = html;
};

const setPlayVideo = () => {
  const html = `
  <i class="stop fas fa-video-slash"></i>
    <span>Play Video</span>
  `;
  document.querySelector(".main__video_button").innerHTML = html;
};
