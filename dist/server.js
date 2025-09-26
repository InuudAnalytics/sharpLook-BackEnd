"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.io = void 0;
const http_1 = __importDefault(require("http"));
const socket_io_1 = require("socket.io");
const app_1 = __importDefault(require("./app"));
const socket_handlers_1 = require("./sockets/socket.handlers");
const PORT = parseInt(process.env.PORT || '4000', 10);
const server = http_1.default.createServer(app_1.default);
const io = new socket_io_1.Server(server, {
    cors: {
        origin: "*", // You can restrict this to specific origins in production
        methods: ["GET", "POST"],
    },
});
exports.io = io;
// Register socket event handlers
(0, socket_handlers_1.registerSocketHandlers)(io);
// Start server on 0.0.0.0 to allow external access
server.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Server running on port ${PORT}`);
});
exports.default = server;
// // server.ts
// import dotenv from "dotenv";
// dotenv.config(); // must be first
// import http from "http";
// import { Server as SocketIOServer } from "socket.io";
// import app from "./app";
// import { registerSocketHandlers } from "./sockets/socket.handlers";
// // ✅ Import Firebase to initialize
// import "./utils/firebase";
// const PORT = parseInt(process.env.PORT || '4000', 10);
// const server = http.createServer(app);
// const io = new SocketIOServer(server, {
//   cors: {
//     origin: "*",
//     methods: ["GET", "POST"],
//   },
// });
// registerSocketHandlers(io);
// server.listen(PORT, '0.0.0.0', () => {
//   console.log(`✅ Server running on port ${PORT}`);
// });
// export { io };
// export default server;
