import { Server, Socket } from "socket.io"
import prisma from "../config/prisma";
import { saveMessage, markMessagesAsRead } from "../services/message.service"
import { generateRoomId } from "../utils/generateRoomId"
import { pushNotificationService } from "../services/pushNotifications.service";
// import { User } from "../models/user.model";

export const registerSocketHandlers = (io: Server) => {
  io.on("connection", (socket: Socket) => {
    console.log("🟢 Socket connected:", socket.id);

    // Join chat room
    socket.on("joinRoom", ({ userA, userB }) => {
      const roomId = generateRoomId(userA, userB);
      socket.join(roomId);
      console.log(`Socket ${socket.id} joined room ${roomId}`);
    });

    // send message 
    socket.on("sendMessage", async ({ senderId, receiverId, message }) => {
      const roomId = generateRoomId(senderId, receiverId);

      // save message to DB
      const saved = await saveMessage(senderId, receiverId, roomId, message);

      // Emit the new message (for real-time chat update)
      io.to(roomId).emit("newMessage", {
        id: saved.id,
        roomId,
        senderId,
        receiverId,
        message,
        timestamp: saved.createdAt,
      });
  

   // Fetch receiver fcmToken
    try {
      const receiver = await prisma.user.findUnique({
        where: { id: receiverId },
        select: { fcmToken: true, firstName: true, email: true },
      });

       // send push notification (if the receiver is offline or backgrounded)
      if (receiver?.fcmToken) {
        await pushNotificationService.sendPushNotification(
          receiver.fcmToken,
          "New Message",
          message,
          {
            type: "CHAT_MESSAGE",
            roomId,
            senderId,
          }
        );

        console.log(` Push notification sent to ${receiver.firstName || receiver.email}`);
      } else {
        console.log(` No FCM token found for receiver ${receiverId}`);
      }
    } catch (error) {
      console.error(" Error sending push notification:", error);
    }
  });

  // Typing indicators 
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
