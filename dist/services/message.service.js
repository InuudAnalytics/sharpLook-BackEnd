"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateUserActivity = exports.editMessage = exports.deleteMessage = exports.getVendorChatPreviews = exports.getClientChatPreviews = exports.getChatPreviews = exports.getVendorChatList = exports.getClientChatList = exports.getChatListForUser = exports.countUnreadMessages = exports.toggleMessageLike = exports.markMessagesAsRead = exports.getMessagesByRoomId = exports.saveMessage = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
const saveMessage = async (senderId, receiverId, roomId, message, type = "text", mediaUrl, duration) => {
    return await prisma_1.default.message.create({
        data: {
            message,
            roomId,
            read: false,
            likedBy: [],
            type: type || "text",
            mediaUrl: mediaUrl || null,
            duration: duration || null,
            sender: {
                connect: { id: senderId },
            },
            receiver: {
                connect: { id: receiverId },
            },
        },
    });
};
exports.saveMessage = saveMessage;
const getMessagesByRoomId = async (roomId) => {
    return await prisma_1.default.message.findMany({
        where: { roomId },
        orderBy: { createdAt: "asc" },
        include: {
            sender: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    avatar: true,
                    isOnline: true,
                    lastSeen: true,
                },
            },
            receiver: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    avatar: true,
                    isOnline: true,
                    lastSeen: true,
                },
            },
        },
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
            readAt: new Date(),
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
    const likedBy = message.likedBy ?? [];
    const hasLiked = likedBy.includes(userId);
    const updatedLikedBy = hasLiked
        ? likedBy.filter((id) => id !== userId)
        : [...likedBy, userId];
    const updated = await prisma_1.default.message.update({
        where: { id: messageId },
        data: {
            likedBy: { set: updatedLikedBy },
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
const getChatListForUser = async (userId) => {
    const roomIds = await prisma_1.default.message.findMany({
        where: {
            OR: [{ senderId: userId }, { receiverId: userId }],
        },
        select: {
            roomId: true,
        },
        distinct: ['roomId'],
    });
    const roomIdList = roomIds.map((r) => r.roomId);
    const messages = await Promise.all(roomIdList.map(async (roomId) => {
        const latestMessage = await prisma_1.default.message.findFirst({
            where: {
                roomId,
            },
            orderBy: {
                createdAt: 'desc',
            },
            select: {
                roomId: true,
                createdAt: true,
                sender: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        phone: true,
                        role: true,
                        avatar: true,
                        isOnline: true,
                        lastSeen: true,
                        vendorOnboarding: {
                            select: {
                                businessName: true,
                            },
                        },
                    },
                },
                receiver: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        phone: true,
                        role: true,
                        avatar: true,
                        isOnline: true,
                        lastSeen: true,
                        vendorOnboarding: {
                            select: {
                                businessName: true,
                            },
                        },
                    },
                },
            },
        });
        return latestMessage;
    }));
    return messages
        .filter((msg) => msg !== null)
        .map((room) => ({
        roomId: room.roomId,
        createdAt: room.createdAt,
        sender: {
            id: room.sender.id,
            name: room.sender.role === 'VENDOR' && room.sender.vendorOnboarding?.businessName
                ? room.sender.vendorOnboarding.businessName
                : `${room.sender.firstName} ${room.sender.lastName}`,
            email: room.sender.email,
            phone: room.sender.phone,
            avatar: room.sender.avatar,
            role: room.sender.role,
            isOnline: room.sender.isOnline,
            lastSeen: room.sender.lastSeen,
        },
        receiver: {
            id: room.receiver.id,
            name: room.receiver.role === 'VENDOR' && room.receiver.vendorOnboarding?.businessName
                ? room.receiver.vendorOnboarding.businessName
                : `${room.receiver.firstName} ${room.receiver.lastName}`,
            email: room.receiver.email,
            phone: room.receiver.phone,
            avatar: room.receiver.avatar,
            role: room.receiver.role,
            isOnline: room.receiver.isOnline,
            lastSeen: room.receiver.lastSeen,
        },
    }));
};
exports.getChatListForUser = getChatListForUser;
const getClientChatList = async (userId) => {
    const messages = await prisma_1.default.message.findMany({
        where: {
            OR: [{ senderId: userId }, { receiverId: userId }],
        },
        orderBy: { createdAt: 'desc' },
        select: {
            id: true,
            roomId: true,
            createdAt: true,
            message: true,
            type: true,
            mediaUrl: true,
            duration: true,
            read: true,
            readAt: true,
            sender: {
                select: {
                    id: true,
                    role: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                    avatar: true,
                    phone: true,
                    isOnline: true,
                    lastSeen: true,
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
                    phone: true,
                    isOnline: true,
                    lastSeen: true,
                    vendorOnboarding: { select: { businessName: true } },
                },
            },
        },
    });
    const grouped = messages.reduce((acc, message) => {
        const otherUser = message.sender.id === userId ? message.receiver : message.sender;
        if (otherUser.role !== 'VENDOR')
            return acc;
        if (!acc[message.roomId]) {
            acc[message.roomId] = {
                roomId: message.roomId,
                vendor: {
                    id: otherUser.id,
                    name: otherUser.vendorOnboarding?.businessName || `${otherUser.firstName} ${otherUser.lastName}`,
                    email: otherUser.email,
                    avatar: otherUser.avatar,
                    phoneNumber: otherUser.phone,
                    isOnline: otherUser.isOnline,
                    lastSeen: otherUser.lastSeen,
                },
                messages: [],
            };
        }
        acc[message.roomId].messages.push({
            id: message.id,
            createdAt: message.createdAt,
            message: message.message,
            senderId: message.sender.id,
            type: message.type,
            mediaUrl: message.mediaUrl,
            duration: message.duration,
            seen: message.read,
            seenAt: message.readAt,
        });
        return acc;
    }, {});
    return Object.values(grouped);
};
exports.getClientChatList = getClientChatList;
const getVendorChatList = async (userId) => {
    const messages = await prisma_1.default.message.findMany({
        where: {
            OR: [{ senderId: userId }, { receiverId: userId }],
        },
        orderBy: { createdAt: 'desc' },
        select: {
            id: true,
            roomId: true,
            createdAt: true,
            message: true,
            type: true,
            mediaUrl: true,
            duration: true,
            read: true,
            readAt: true,
            sender: {
                select: {
                    id: true,
                    role: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                    avatar: true,
                    phone: true,
                    isOnline: true,
                    lastSeen: true,
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
                    phone: true,
                    isOnline: true,
                    lastSeen: true,
                },
            },
        },
    });
    const grouped = messages.reduce((acc, message) => {
        const { roomId } = message;
        if (!roomId)
            return acc;
        const otherUser = message.sender.id === userId ? message.receiver : message.sender;
        if (otherUser.role !== 'CLIENT')
            return acc;
        if (!acc[roomId]) {
            acc[roomId] = {
                roomId,
                createdAt: message.createdAt,
                message: message.message,
                client: {
                    id: otherUser.id,
                    name: `${otherUser.firstName} ${otherUser.lastName}`,
                    email: otherUser.email,
                    avatar: otherUser.avatar,
                    phoneNumber: otherUser.phone,
                    isOnline: otherUser.isOnline,
                    lastSeen: otherUser.lastSeen,
                },
                messages: [],
            };
        }
        acc[roomId].messages.push({
            id: message.id,
            createdAt: message.createdAt,
            message: message.message,
            senderId: message.sender.id,
            type: message.type,
            mediaUrl: message.mediaUrl,
            duration: message.duration,
            seen: message.read,
            seenAt: message.readAt,
        });
        return acc;
    }, {});
    return Object.values(grouped);
};
exports.getVendorChatList = getVendorChatList;
const getChatPreviews = async (userId) => {
    const rooms = await (0, exports.getChatListForUser)(userId);
    const previews = await Promise.all(rooms.map(async (room) => {
        const lastMessage = await prisma_1.default.message.findFirst({
            where: { roomId: room.roomId },
            orderBy: { createdAt: "desc" },
        });
        return {
            roomId: room.roomId,
            lastMessage,
        };
    }));
    return previews;
};
exports.getChatPreviews = getChatPreviews;
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
// Helper function to update user's last activity
const updateUserActivity = async (userId) => {
    try {
        await prisma_1.default.user.update({
            where: { id: userId },
            data: {
                lastSeen: new Date(),
            },
        });
    }
    catch (error) {
        console.error("Error updating user activity:", error);
    }
};
exports.updateUserActivity = updateUserActivity;
