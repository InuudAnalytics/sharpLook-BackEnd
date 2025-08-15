import prisma from "../config/prisma";

export const saveMessage = async (
  senderId: string,
  receiverId: string,
  roomId: string,
  message: string
) => {
  return await prisma.message.create({
    data: {
      senderId,
      receiverId,
      roomId,
      message,
    },
  });
};

export const getMessagesByRoomId = async (roomId: string) => {
  return await prisma.message.findMany({
    where: { roomId },
    orderBy: { createdAt: "asc" },
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
    },
  });
};

export const toggleMessageLike = async (messageId: string, userId: string) => {
  const message = await prisma.message.findUnique({
    where: { id: messageId },
    select: { likedBy: true },
  });

  if (!message) throw new Error("Message not found");

  // Ensure likedBy is an array
  const likedBy: string[] = message.likedBy ?? [];

  const hasLiked = likedBy.includes(userId);

  const updatedLikedBy = hasLiked
    ? likedBy.filter((id) => id !== userId)
    : [...likedBy, userId];

  const updated = await prisma.message.update({
    where: { id: messageId },
    data: {
      likedBy: { set: updatedLikedBy }, // ✅ Prisma expects { set: string[] }
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
  // Step 1: Get unique roomIds where the user is a participant
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

  // Step 2: For each roomId, get the latest message (ordered by createdAt DESC)
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

  // Filter out any null messages (shouldn’t happen unless deleted)
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
      },
    }));
};

export const getClientChatList = async (userId: string) => {
  // Step 1: Get all distinct room IDs involving the user
  const roomIds = await prisma.message.findMany({
    where: {
      OR: [{ senderId: userId }, { receiverId: userId }],
    },
    select: { roomId: true },
    distinct: ['roomId'],
  });

  const roomIdList = roomIds.map((r) => r.roomId);

  // Step 2: Fetch messages for each room + vendor info
  const chatList = await Promise.all(
    roomIdList.map(async (roomId) => {
      const messages = await prisma.message.findMany({
        where: { roomId },
        orderBy: { createdAt: 'asc' },
        select: {
          id: true,
          message: true,
          createdAt: true,
          senderId: true,
          receiverId: true,
          sender: {
            select: {
              id: true,
              role: true,
              firstName: true,
              lastName: true,
              avatar: true,
            },
          },
          receiver: {
            select: {
              id: true,
              role: true,
              firstName: true,
              lastName: true,
              avatar: true,
            },
          },
        },
      });

      if (!messages || messages.length === 0) return null;

      // Find the vendor participant in the conversation
      const firstMsg = messages[0];
      const userIsSender = firstMsg.sender.id === userId;
      const otherUser = userIsSender ? firstMsg.receiver : firstMsg.sender;

      if (otherUser.role !== 'VENDOR') return null;

      const vendor = await prisma.user.findUnique({
        where: { id: otherUser.id },
        select: {
          id: true,
          email: true,
          phone: true,
          avatar: true,
          firstName: true,
          lastName: true,
          vendorOnboarding: { select: { businessName: true } },
        },
      });

      if (!vendor) return null;

      return {
        roomId,
        vendor: {
          id: vendor.id,
          name: vendor.vendorOnboarding?.businessName || `${vendor.firstName} ${vendor.lastName}`,
          email: vendor.email,
          avatar: vendor.avatar,
          phoneNumber: vendor.phone,
        },
        messages: messages.map((msg) => ({
          id: msg.id,
          message: msg.message,
          createdAt: msg.createdAt,
          from: {
            id: msg.sender.id,
            name: `${msg.sender.firstName} ${msg.sender.lastName}`,
            avatar: msg.sender.avatar,
          },
          to: {
            id: msg.receiver.id,
            name: `${msg.receiver.firstName} ${msg.receiver.lastName}`,
            avatar: msg.receiver.avatar,
          },
        })),
      };
    })
  );

  return chatList.filter(Boolean);
};


export const getVendorChatList = async (userId: string) => {
  // Step 1: Get all distinct room IDs involving the vendor
  const roomIds = await prisma.message.findMany({
    where: {
      OR: [{ senderId: userId }, { receiverId: userId }],
    },
    select: { roomId: true },
    distinct: ['roomId'],
  });

  const roomIdList = roomIds.map((r) => r.roomId);

  // Step 2: Fetch messages for each room + client info
  const chatList = await Promise.all(
    roomIdList.map(async (roomId) => {
      const messages = await prisma.message.findMany({
        where: { roomId },
        orderBy: { createdAt: 'asc' },
        select: {
          id: true,
          message: true,
          createdAt: true,
          senderId: true,
          receiverId: true,
          sender: {
            select: {
              id: true,
              role: true,
              firstName: true,
              lastName: true,
              avatar: true,
            },
          },
          receiver: {
            select: {
              id: true,
              role: true,
              firstName: true,
              lastName: true,
              avatar: true,
            },
          },
        },
      });

      if (!messages || messages.length === 0) return null;

      // Determine the other user in the conversation (the client)
      const firstMsg = messages[0];
      const userIsSender = firstMsg.sender.id === userId;
      const otherUser = userIsSender ? firstMsg.receiver : firstMsg.sender;

      if (otherUser.role !== 'CLIENT') return null;

      const client = await prisma.user.findUnique({
        where: { id: otherUser.id },
        select: {
          id: true,
          email: true,
          phone: true,
          avatar: true,
          firstName: true,
          lastName: true,
        },
      });

      if (!client) return null;

      return {
        roomId,
        client: {
          id: client.id,
          name: `${client.firstName} ${client.lastName}`,
          email: client.email,
          avatar: client.avatar,
          phoneNumber: client.phone,
        },
        messages: messages.map((msg) => ({
          id: msg.id,
          message: msg.message,
          createdAt: msg.createdAt,
          from: {
            id: msg.sender.id,
            name: `${msg.sender.firstName} ${msg.sender.lastName}`,
            avatar: msg.sender.avatar,
          },
          to: {
            id: msg.receiver.id,
            name: `${msg.receiver.firstName} ${msg.receiver.lastName}`,
            avatar: msg.receiver.avatar,
          },
        })),
      };
    })
  );

  return chatList.filter(Boolean);
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

