import { Server, Socket } from "socket.io"
import { saveMessage, markMessagesAsRead } from "../services/message.service"
import { generateRoomId } from "../utils/generateRoomId"

export const registerSocketHandlers = (io: Server) => {
  io.on("connection", (socket: Socket) => {
    console.log("🟢 Socket connected:", socket.id);

    socket.on("joinRoom", ({ userA, userB }) => {
      const roomId = generateRoomId(userA, userB);
      socket.join(roomId);
      console.log(`Socket ${socket.id} joined room ${roomId}`);
    });

    socket.on("sendMessage", async ({ senderId, receiverId, message }) => {
      const roomId = generateRoomId(senderId, receiverId);
      const saved = await saveMessage(senderId, receiverId, roomId, message);
      io.to(roomId).emit("newMessage", {
        id: saved.id,
        roomId,
        senderId,
        receiverId,
        message,
        timestamp: saved.createdAt,
      });
    });

    socket.on("typing", ({ roomId, senderId }) => {
      socket.to(roomId).emit("userTyping", { roomId, senderId });
    });

    socket.on("stopTyping", ({ roomId, senderId }) => {
      socket.to(roomId).emit("userStoppedTyping", { roomId, senderId });
    });

    socket.on("markAsRead", async ({ roomId, userId }) => {
      await markMessagesAsRead(roomId, userId);
      io.to(roomId).emit("messagesRead", { roomId, userId });
    });

    // --- 🟡 In-App Call Events ---
    socket.on("call:offer", ({ toUserId, offer, fromUserId }) => {
      const roomId = generateRoomId(fromUserId, toUserId);
      io.to(roomId).emit("call:incoming", { fromUserId, offer });
    });

    socket.on("call:answer", ({ toUserId, answer, fromUserId }) => {
      const roomId = generateRoomId(fromUserId, toUserId);
      io.to(roomId).emit("call:answer", { fromUserId, answer });
    });

    socket.on("ice-candidate", ({ toUserId, candidate, fromUserId }) => {
      const roomId = generateRoomId(fromUserId, toUserId);
      io.to(roomId).emit("ice-candidate", { fromUserId, candidate });
    });

    socket.on("call:end", ({ toUserId, fromUserId }) => {
      const roomId = generateRoomId(fromUserId, toUserId);
      io.to(roomId).emit("call:ended", { fromUserId });
    });

    

    socket.on("disconnect", () => {
      console.log("🔴 Socket disconnected:", socket.id);
    });

    // --- Booking Events ---
    socket.on("joinBookingRoom", ({ bookingId }) => {
      socket.join(`booking_${bookingId}`);
      console.log(`Socket ${socket.id} joined booking room booking_${bookingId}`);
    });

  });
};
