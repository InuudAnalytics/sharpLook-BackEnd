import { Server, Socket } from "socket.io";
import prisma from "../config/prisma";
import { saveMessage, markMessagesAsRead } from "../services/message.service";
import { generateRoomId } from "../utils/generateRoomId";
import { pushNotificationService } from "../services/pushNotifications.service";

// Store online users with their socket IDs and last activity
const onlineUsers = new Map<string, { socketId: string; lastSeen: Date }>();

export const registerSocketHandlers = (io: Server) => {
  io.on("connection", (socket: Socket) => {
    console.log("🟢 Socket connected:", socket.id);

    const userId = socket.handshake.query.userId as string;

    // Register user as online
    if (userId) {
      onlineUsers.set(userId, {
        socketId: socket.id,
        lastSeen: new Date(),
      });
      console.log(`User ${userId} is now online`);

      // Broadcast to all users that this user is online
      io.emit("user:online", { userId });

      // Update user's online status in database
      updateUserOnlineStatus(userId, true).catch(console.error);
    }

    // Handle user online status registration
    socket.on("user:online", ({ userId: onlineUserId }) => {
      if (onlineUserId) {
        onlineUsers.set(onlineUserId, {
          socketId: socket.id,
          lastSeen: new Date(),
        });
        io.emit("user:online", { userId: onlineUserId });
        updateUserOnlineStatus(onlineUserId, true).catch(console.error);
      }
    });

    // Handle check user status
    socket.on("user:checkStatus", async ({ userId: checkUserId }) => {
      const isOnline = onlineUsers.has(checkUserId);
      let lastSeen = null;

      if (!isOnline) {
        // Get last seen from database
        try {
          const user = await prisma.user.findUnique({
            where: { id: checkUserId },
            select: { lastSeen: true },
          });
          lastSeen = user?.lastSeen;
        } catch (error) {
          console.error("Error fetching last seen:", error);
        }
      }

      socket.emit("user:status", {
        userId: checkUserId,
        isOnline,
        lastSeen,
      });
    });

    // Handle user offline
    socket.on("user:offline", async ({ userId: offlineUserId }) => {
      if (offlineUserId) {
        const lastSeen = new Date();
        onlineUsers.delete(offlineUserId);
        
        // Broadcast to all users
        io.emit("user:offline", { userId: offlineUserId, lastSeen });
        
        // Update database
        await updateUserOnlineStatus(offlineUserId, false, lastSeen);
      }
    });

    // Join chat room
    socket.on("joinRoom", ({ userA, userB }) => {
      const roomId = generateRoomId(userA, userB);
      socket.join(roomId);
      console.log(`Socket ${socket.id} joined room ${roomId}`);
    });

    // Join room (alternate event name for compatibility)
    socket.on("join-room", (roomId: string) => {
      socket.join(roomId);
      console.log(`Socket ${socket.id} joined room ${roomId}`);
    });

    // Send message
    socket.on("sendMessage", async ({ senderId, receiverId, message, tempId, type, mediaUrl, duration }) => {
      const roomId = generateRoomId(senderId, receiverId);

      try {
        // Save message to DB
        const saved = await saveMessage(senderId, receiverId, roomId, message, type, mediaUrl, duration);

        // Emit the new message (for real-time chat update)
        io.to(roomId).emit("newMessage", {
          id: saved.id,
          tempId,
          roomId,
          senderId,
          receiverId,
          message: saved.message,
          type: saved.type || "text",
          mediaUrl: saved.mediaUrl,
          duration: saved.duration,
          timestamp: saved.createdAt,
          createdAt: saved.createdAt,
        });

        // Emit success to sender
        socket.emit("messageSent", {
          tempId,
          message: {
            id: saved.id,
            roomId,
            senderId,
            receiverId,
            message: saved.message,
            type: saved.type,
            mediaUrl: saved.mediaUrl,
            createdAt: saved.createdAt,
          },
        });

        // Fetch receiver fcmToken
        const receiver = await prisma.user.findUnique({
          where: { id: receiverId },
          select: { fcmToken: true, firstName: true, email: true },
        });

        // Send push notification only if receiver is offline
        if (receiver?.fcmToken && !onlineUsers.has(receiverId)) {
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
          console.log(`✅ Push notification sent to ${receiver.firstName || receiver.email}`);
        } else if (onlineUsers.has(receiverId)) {
          console.log(`ℹ️ User ${receiverId} is online, skipping push notification`);
        } else {
          console.log(`⚠️ No FCM token found for receiver ${receiverId}`);
        }
      } catch (error) {
        console.error("❌ Error sending message:", error);
        socket.emit("messageError", {
          tempId,
          error: "Failed to send message",
        });
      }
    });

    // Typing indicators
    socket.on("typing", ({ roomId, senderId }) => {
      socket.to(roomId).emit("userTyping", { roomId, senderId });
    });

    socket.on("stopTyping", ({ roomId, senderId }) => {
      socket.to(roomId).emit("userStoppedTyping", { roomId, senderId });
    });

    // Mark messages as read
    socket.on("markAsRead", async ({ roomId, userId: readUserId }) => {
      try {
        await markMessagesAsRead(roomId, readUserId);
        io.to(roomId).emit("messagesRead", { roomId, userId: readUserId });
      } catch (error) {
        console.error("Error marking messages as read:", error);
      }
    });

    // Mark messages as read (alternate event name)
    socket.on("messagesRead", async ({ roomId, userId: readUserId }) => {
      try {
        await markMessagesAsRead(roomId, readUserId);
        io.to(roomId).emit("messagesRead", { roomId, userId: readUserId });
      } catch (error) {
        console.error("Error marking messages as read:", error);
      }
    });

    // --- 🟡 In-App Call Events ---
    socket.on("call:offer", ({ toUserId, offer, fromUserId, callType }) => {
      const roomId = generateRoomId(fromUserId, toUserId);
      const receiverSocketData = onlineUsers.get(toUserId);

      if (receiverSocketData) {
        io.to(receiverSocketData.socketId).emit("call:incoming", {
          fromUserId,
          offer,
          callType,
        });
      } else {
        // Receiver is offline, send push notification
        sendCallNotification(toUserId, fromUserId, callType).catch(console.error);
      }
    });

    socket.on("call:answer", ({ toUserId, answer, fromUserId }) => {
      const receiverSocketData = onlineUsers.get(toUserId);
      if (receiverSocketData) {
        io.to(receiverSocketData.socketId).emit("call:answer", {
          fromUserId,
          answer,
        });
      }
    });

    socket.on("ice-candidate", ({ toUserId, candidate, fromUserId }) => {
      const receiverSocketData = onlineUsers.get(toUserId);
      if (receiverSocketData) {
        io.to(receiverSocketData.socketId).emit("ice-candidate", {
          fromUserId,
          candidate,
        });
      }
    });

    socket.on("call:end", ({ toUserId, fromUserId }) => {
      const receiverSocketData = onlineUsers.get(toUserId);
      if (receiverSocketData) {
        io.to(receiverSocketData.socketId).emit("call:ended", {
          fromUserId,
        });
      }
    });

    // --- Booking Events ---
    socket.on("joinBookingRoom", ({ bookingId }) => {
      socket.join(`booking_${bookingId}`);
      console.log(`Socket ${socket.id} joined booking room booking_${bookingId}`);
    });

    // Handle disconnect
    socket.on("disconnect", async () => {
      console.log("🔴 Socket disconnected:", socket.id);

      if (userId) {
        const lastSeen = new Date();
        onlineUsers.delete(userId);

        // Broadcast to all users
        io.emit("user:offline", { userId, lastSeen });

        // Update database
        await updateUserOnlineStatus(userId, false, lastSeen);
        console.log(`User ${userId} is now offline`);
      }
    });
  });
};

// Helper function to update user online status in database
async function updateUserOnlineStatus(
  userId: string,
  isOnline: boolean,
  lastSeen?: Date
) {
  try {
    await prisma.user.update({
      where: { id: userId },
      data: {
        isOnline,
        lastSeen: lastSeen || new Date(),
      },
    });
  } catch (error) {
    console.error("Error updating user online status:", error);
  }
}

// Helper function to send call notification
async function sendCallNotification(
  receiverId: string,
  callerId: string,
  callType: string
) {
  try {
    const [receiver, caller] = await Promise.all([
      prisma.user.findUnique({
        where: { id: receiverId },
        select: { fcmToken: true },
      }),
      prisma.user.findUnique({
        where: { id: callerId },
        select: { firstName: true, lastName: true },
      }),
    ]);

    if (receiver?.fcmToken && caller) {
      const callerName = `${caller.firstName} ${caller.lastName || ""}`.trim();
      await pushNotificationService.sendPushNotification(
        receiver.fcmToken,
        `Incoming ${callType} call`,
        `${callerName} is calling you...`,
        {
          type: "INCOMING_CALL",
          callerId,
          callType,
        }
      );
    }
  } catch (error) {
    console.error("Error sending call notification:", error);
  }
}

// Export helper to check if user is online (can be used in other parts of your app)
export function isUserOnline(userId: string): boolean {
  return onlineUsers.has(userId);
}

// Get all online users (useful for admin dashboard, etc.)
export function getOnlineUsers(): string[] {
  return Array.from(onlineUsers.keys());
}

// Get online user count
export function getOnlineUserCount(): number {
  return onlineUsers.size;
}