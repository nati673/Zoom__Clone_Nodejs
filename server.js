// Import required libraries
const express = require("express");
const app = express();
const server = require("http").Server(app);
const io = require("socket.io")(server);
const { ExpressPeerServer } = require("peer");
const peerServer = ExpressPeerServer(server, {
  debug: true,
});
const { v4: uuidV4 } = require("uuid");

// Set up the Express app
app.use("/peerjs", peerServer); // Use the PeerServer for Peer.js

app.set("view engine", "ejs"); // Set the view engine to EJS
app.use(express.static("public")); // Serve static files from the 'public' directory

// Route for the root URL, generates a new UUID and redirects to the room
app.get("/", (req, res) => {
  res.redirect(`/${uuidV4()}`);
});

// Route to join a specific room with a given UUID
app.get("/:room", (req, res) => {
  res.render("room", { roomId: req.params.room });
});

// Socket.io event handler for handling connections
io.on("connection", (socket) => {
  socket.on("join-room", (roomId, userId) => {
    socket.join(roomId); // Join the specified room
    socket.to(roomId).broadcast.emit("user-connected", userId); // Broadcast a user-connected event to others in the room

    // Socket.io event handler for handling messages within the room
    socket.on("message", (message) => {
      // Send the message to all users in the same room
      io.to(roomId).emit("createMessage", message);
    });

    // Socket.io event handler for disconnecting users
    socket.on("disconnect", () => {
      socket.to(roomId).broadcast.emit("user-disconnected", userId); // Broadcast a user-disconnected event
    });
  });
});

// Start the server and listen on the specified port (or default to 3003)
server.listen(process.env.PORT || 3003);
