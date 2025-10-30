import prisma from "../config/prisma";

export const saveMessage = async (
  senderId: string,
  receiverId: string,
  roomId: string,
  message: string,
  type: string = "text",
  mediaUrl?: string,
  duration?: number
) => {
  return await prisma.message.create({
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

export const getMessagesByRoomId = async (roomId: string) => {
  return await prisma.message.findMany({
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

export const markMessagesAsRead = async (roomId: string, userId: string) => {
  return await prisma.message.updateMany({
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

export const toggleMessageLike = async (messageId: string, userId: string) => {
  const message = await prisma.message.findUnique({
    where: { id: messageId },
    select: { likedBy: true },
  });

  if (!message) throw new Error("Message not found");

  const likedBy: string[] = message.likedBy ?? [];
  const hasLiked = likedBy.includes(userId);

  const updatedLikedBy = hasLiked
    ? likedBy.filter((id) => id !== userId)
    : [...likedBy, userId];

  const updated = await prisma.message.update({
    where: { id: messageId },
    data: {
      likedBy: { set: updatedLikedBy },
    },
  });

  return updated;
};

export const countUnreadMessages = async (userId: string) => {
  return await prisma.message.count({
    where: {
      receiverId: userId,
      read: false,
    },
  });
};

export const getChatListForUser = async (userId: string) => {
  const roomIds = await prisma.message.findMany({
    where: {
      OR: [{ senderId: userId }, { receiverId: userId }],
    },
    select: {
      roomId: true,
    },
    distinct: ['roomId'],
  });

  const roomIdList = roomIds.map((r) => r.roomId);

  const messages = await Promise.all(
    roomIdList.map(async (roomId) => {
      const latestMessage = await prisma.message.findFirst({
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
    })
  );

  return messages
    .filter((msg): msg is NonNullable<typeof msg> => msg !== null)
    .map((room) => ({
      roomId: room.roomId,
      createdAt: room.createdAt,
      sender: {
        id: room.sender.id,
        name:
          room.sender.role === 'VENDOR' && room.sender.vendorOnboarding?.businessName
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
        name:
          room.receiver.role === 'VENDOR' && room.receiver.vendorOnboarding?.businessName
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

export const getClientChatList = async (userId: string) => {
  const messages = await prisma.message.findMany({
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

    if (otherUser.role !== 'VENDOR') return acc;

    if (!acc[message.roomId!]) {
      acc[message.roomId!] = {
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

    acc[message.roomId!].messages.push({
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
  }, {} as Record<string, any>);

  return Object.values(grouped);
};

export const getVendorChatList = async (userId: string) => {
  const messages = await prisma.message.findMany({
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

    if (!roomId) return acc;

    const otherUser = message.sender.id === userId ? message.receiver : message.sender;

    if (otherUser.role !== 'CLIENT') return acc;

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
  }, {} as Record<string, any>);

  return Object.values(grouped);
};

export const getChatPreviews = async (userId: string) => {
  const rooms = await getChatListForUser(userId);

  const previews = await Promise.all(
    rooms.map(async (room) => {
      const lastMessage = await prisma.message.findFirst({
        where: { roomId: room.roomId },
        orderBy: { createdAt: "desc" },
      });

      return {
        roomId: room.roomId,
        lastMessage,
      };
    })
  );

  return previews;
};

export const getClientChatPreviews = async (userId: string) => {
  const clientChats = await getClientChatList(userId);

  const previews = await Promise.all(
    clientChats.map(async (chat) => {
      const lastMessage = await prisma.message.findFirst({
        where: { roomId: chat?.roomId },
        orderBy: { createdAt: 'desc' },
      });

      return {
        roomId: chat?.roomId,
        lastMessage,
        vendor: chat?.vendor,
      };
    })
  );

  return previews;
};

export const getVendorChatPreviews = async (userId: string) => {
  const vendorChats = await getVendorChatList(userId);

  const previews = await Promise.all(
    vendorChats.map(async (chat) => {
      const lastMessage = await prisma.message.findFirst({
        where: { roomId: chat?.roomId },
        orderBy: { createdAt: 'desc' },
      });

      return {
        roomId: chat?.roomId,
        lastMessage,
        client: chat?.client,
      };
    })
  );

  return previews;
};

export const deleteMessage = async (messageId: string) => {
  return await prisma.message.delete({
    where: { id: messageId },
  });
};

export const editMessage = async (messageId: string, newText: string) => {
  return await prisma.message.update({
    where: { id: messageId },
    data: { message: newText },
  });
};

// Helper function to update user's last activity
export const updateUserActivity = async (userId: string) => {
  try {
    await prisma.user.update({
      where: { id: userId },
      data: {
        lastSeen: new Date(),
      },
    });
  } catch (error) {
    console.error("Error updating user activity:", error);
  }
};