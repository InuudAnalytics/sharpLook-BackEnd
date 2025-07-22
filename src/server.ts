import http from "http"
import { Server as SocketIOServer } from "socket.io"
import app from "./app"

import { registerSocketHandlers } from "./sockets/socket.handlers"

const PORT =  4000

const server = http.createServer(app)
const io = new SocketIOServer(server, {
  cors: {
    origin: "*", // adjust this in production
    methods: ["GET", "POST"],
  },
})

registerSocketHandlers(io)

server.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server running on port ${PORT}`);
});
