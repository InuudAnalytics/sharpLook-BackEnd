"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.editMessage = exports.deleteMessage = exports.getVendorChatPreviews = exports.getClientChatPreviews = exports.getVendorChatList = exports.getClientChatList = exports.countUnreadMessages = exports.toggleMessageLike = exports.markMessagesAsRead = exports.getMessagesByRoomId = exports.saveMessage = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
const saveMessage = async (senderId, receiverId, roomId, message) => {
    return await prisma_1.default.message.create({
        data: {
            senderId,
            receiverId,
            roomId,
            message,
        },
    });
};
exports.saveMessage = saveMessage;
const getMessagesByRoomId = async (roomId) => {
    return await prisma_1.default.message.findMany({
        where: { roomId },
        orderBy: { createdAt: "asc" },
    });
};
exports.getMessagesByRoomId = getMessagesByRoomId;
const markMessagesAsRead = async (roomId, userId) => {
    return await prisma_1.default.message.updateMany({
        where: {
            roomId,
            receiverId: userId,
            read: false,
        },
        data: {
            read: true,
        },
    });
};
exports.markMessagesAsRead = markMessagesAsRead;
const toggleMessageLike = async (messageId, userId) => {
    const message = await prisma_1.default.message.findUnique({
        where: { id: messageId },
        select: { likedBy: true },
    });
    if (!message)
        throw new Error("Message not found");
    // Ensure likedBy is an array
    const likedBy = message.likedBy ?? [];
    const hasLiked = likedBy.includes(userId);
    const updatedLikedBy = hasLiked
        ? likedBy.filter((id) => id !== userId)
        : [...likedBy, userId];
    const updated = await prisma_1.default.message.update({
        where: { id: messageId },
        data: {
            likedBy: { set: updatedLikedBy }, // ✅ Prisma expects { set: string[] }
        },
    });
    return updated;
};
exports.toggleMessageLike = toggleMessageLike;
const countUnreadMessages = async (userId) => {
    return await prisma_1.default.message.count({
        where: {
            receiverId: userId,
            read: false,
        },
    });
};
exports.countUnreadMessages = countUnreadMessages;
// export const getChatListForUser = async (userId: string) => {
//   // Step 1: Get unique roomIds where the user is a participant
//   const roomIds = await prisma.message.findMany({
//     where: {
//       OR: [{ senderId: userId }, { receiverId: userId }],
//     },
//     select: {
//       roomId: true,
//     },
//     distinct: ['roomId'],
//   });
//   const roomIdList = roomIds.map((r) => r.roomId);
//   // Step 2: For each roomId, get the latest message (ordered by createdAt DESC)
//   const messages = await Promise.all(
//     roomIdList.map(async (roomId) => {
//       const latestMessage = await prisma.message.findFirst({
//         where: {
//           roomId,
//         },
//         orderBy: {
//           createdAt: 'desc',
//         },
//         select: {
//           roomId: true,
//           createdAt: true,
//           sender: {
//             select: {
//               id: true,
//               firstName: true,
//               lastName: true,
//               email: true,
//               phone: true,
//               role: true,
//               avatar: true,
//               vendorOnboarding: {
//                 select: {
//                   businessName: true,
//                 },
//               },
//             },
//           },
//           receiver: {
//             select: {
//               id: true,
//               firstName: true,
//               lastName: true,
//               email: true,
//               phone: true,
//               role: true,
//               avatar: true,
//               vendorOnboarding: {
//                 select: {
//                   businessName: true,
//                 },
//               },
//             },
//           },
//         },
//       });
//       return latestMessage;
//     })
//   );
//   // Filter out any null messages (shouldn’t happen unless deleted)
//   return messages
//     .filter((msg): msg is NonNullable<typeof msg> => msg !== null)
//     .map((room) => ({
//       roomId: room.roomId,
//       createdAt: room.createdAt,
//       sender: {
//         id: room.sender.id,
//         name:
//           room.sender.role === 'VENDOR' && room.sender.vendorOnboarding?.businessName
//             ? room.sender.vendorOnboarding.businessName
//             : `${room.sender.firstName} ${room.sender.lastName}`,
//         email: room.sender.email,
//         phone: room.sender.phone,
//         avatar: room.sender.avatar,
//         role: room.sender.role,
//       },
//       receiver: {
//         id: room.receiver.id,
//         name:
//           room.receiver.role === 'VENDOR' && room.receiver.vendorOnboarding?.businessName
//             ? room.receiver.vendorOnboarding.businessName
//             : `${room.receiver.firstName} ${room.receiver.lastName}`,
//         email: room.receiver.email,
//         phone: room.receiver.phone,
//         avatar: room.receiver.avatar,
//         role: room.receiver.role,
//       },
//     }));
// };
const getClientChatList = async (userId) => {
    // Get distinct room IDs where the client was involved
    const roomIds = await prisma_1.default.message.findMany({
        where: {
            OR: [{ senderId: userId }, { receiverId: userId }],
        },
        select: { roomId: true },
        distinct: ['roomId'],
    });
    const roomIdList = roomIds.map((r) => r.roomId);
    // For each room, get the latest message and extract the vendor info
    const chatList = await Promise.all(roomIdList.map(async (roomId) => {
        const message = await prisma_1.default.message.findFirst({
            where: { roomId },
            orderBy: { createdAt: 'desc' },
            select: {
                roomId: true,
                createdAt: true,
                sender: {
                    select: {
                        id: true,
                        role: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        avatar: true,
                        vendorOnboarding: { select: { businessName: true } },
                    },
                },
                receiver: {
                    select: {
                        id: true,
                        role: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        avatar: true,
                        vendorOnboarding: { select: { businessName: true } },
                    },
                },
            },
        });
        if (!message)
            return null;
        const otherUser = message.sender.id === userId ? message.receiver : message.sender;
        if (otherUser.role !== 'VENDOR')
            return null;
        return {
            roomId: message.roomId,
            createdAt: message.createdAt,
            vendor: {
                id: otherUser.id,
                name: otherUser.vendorOnboarding?.businessName || `${otherUser.firstName} ${otherUser.lastName}`,
                email: otherUser.email,
                avatar: otherUser.avatar,
            },
        };
    }));
    return chatList.filter(Boolean);
};
exports.getClientChatList = getClientChatList;
const getVendorChatList = async (userId) => {
    // Get distinct room IDs where the vendor was involved
    const roomIds = await prisma_1.default.message.findMany({
        where: {
            OR: [{ senderId: userId }, { receiverId: userId }],
        },
        select: { roomId: true },
        distinct: ['roomId'],
    });
    const roomIdList = roomIds.map((r) => r.roomId);
    // For each room, get the latest message and extract the client info
    const chatList = await Promise.all(roomIdList.map(async (roomId) => {
        const message = await prisma_1.default.message.findFirst({
            where: { roomId },
            orderBy: { createdAt: 'desc' },
            select: {
                roomId: true,
                createdAt: true,
                sender: {
                    select: {
                        id: true,
                        role: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        avatar: true,
                    },
                },
                receiver: {
                    select: {
                        id: true,
                        role: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        avatar: true,
                    },
                },
            },
        });
        if (!message)
            return null;
        const otherUser = message.sender.id === userId ? message.receiver : message.sender;
        if (otherUser.role !== 'CLIENT')
            return null;
        return {
            roomId: message.roomId,
            createdAt: message.createdAt,
            client: {
                id: otherUser.id,
                name: `${otherUser.firstName} ${otherUser.lastName}`,
                email: otherUser.email,
                avatar: otherUser.avatar,
            },
        };
    }));
    return chatList.filter(Boolean);
};
exports.getVendorChatList = getVendorChatList;
// export const getChatPreviews = async (userId: string) => {
//   const rooms = await getChatListForUser(userId);
//   const previews = await Promise.all(
//     rooms.map(async (room) => {
//       const lastMessage = await prisma.message.findFirst({
//         where: { roomId: room.roomId },
//         orderBy: { createdAt: "desc" },
//       });
//       return {
//         roomId: room.roomId,
//         lastMessage,
//       };
//     })
//   );
//   return previews;
// };
const getClientChatPreviews = async (userId) => {
    const clientChats = await (0, exports.getClientChatList)(userId);
    const previews = await Promise.all(clientChats.map(async (chat) => {
        const lastMessage = await prisma_1.default.message.findFirst({
            where: { roomId: chat?.roomId },
            orderBy: { createdAt: 'desc' },
        });
        return {
            roomId: chat?.roomId,
            lastMessage,
            vendor: chat?.vendor,
        };
    }));
    return previews;
};
exports.getClientChatPreviews = getClientChatPreviews;
const getVendorChatPreviews = async (userId) => {
    const vendorChats = await (0, exports.getVendorChatList)(userId);
    const previews = await Promise.all(vendorChats.map(async (chat) => {
        const lastMessage = await prisma_1.default.message.findFirst({
            where: { roomId: chat?.roomId },
            orderBy: { createdAt: 'desc' },
        });
        return {
            roomId: chat?.roomId,
            lastMessage,
            client: chat?.client,
        };
    }));
    return previews;
};
exports.getVendorChatPreviews = getVendorChatPreviews;
const deleteMessage = async (messageId) => {
    return await prisma_1.default.message.delete({
        where: { id: messageId },
    });
};
exports.deleteMessage = deleteMessage;
const editMessage = async (messageId, newText) => {
    return await prisma_1.default.message.update({
        where: { id: messageId },
        data: { message: newText },
    });
};
exports.editMessage = editMessage;
