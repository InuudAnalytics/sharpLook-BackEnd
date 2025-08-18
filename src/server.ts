import http from "http";
import { Server as SocketIOServer } from "socket.io";
import app from "./app";
import { registerSocketHandlers } from "./sockets/socket.handlers";

const PORT = parseInt(process.env.PORT || '4000', 10);


const server = http.createServer(app);


const io = new SocketIOServer(server, {
  cors: {
    origin: "*", // You can restrict this to specific origins in production
    methods: ["GET", "POST"],
  },
});

// Register socket event handlers
registerSocketHandlers(io);

export { io }; 

// Start server on 0.0.0.0 to allow external access
server.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server running on port ${PORT}`);
});


export default server;
