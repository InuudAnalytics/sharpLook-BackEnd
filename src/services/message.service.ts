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


export const getClientChatList = async (userId: string) => {
  // Get distinct room IDs where the client was involved
  const roomIds = await prisma.message.findMany({
    where: {
      OR: [{ senderId: userId }, { receiverId: userId }],
    },
    select: { roomId: true },
    distinct: ['roomId'],
  });

  const roomIdList = roomIds.map((r) => r.roomId);

  // For each room, get the latest message and extract the vendor info
  const chatList = await Promise.all(
    roomIdList.map(async (roomId) => {
      const message = await prisma.message.findFirst({
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

      if (!message) return null;

      const otherUser = message.sender.id === userId ? message.receiver : message.sender;

      if (otherUser.role !== 'VENDOR') return null;

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
    })
  );

  return chatList.filter(Boolean);
};


export const getVendorChatList = async (userId: string) => {
  // Get distinct room IDs where the vendor was involved
  const roomIds = await prisma.message.findMany({
    where: {
      OR: [{ senderId: userId }, { receiverId: userId }],
    },
    select: { roomId: true },
    distinct: ['roomId'],
  });

  const roomIdList = roomIds.map((r) => r.roomId);

  // For each room, get the latest message and extract the client info
  const chatList = await Promise.all(
    roomIdList.map(async (roomId) => {
      const message = await prisma.message.findFirst({
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

      if (!message) return null;

      const otherUser = message.sender.id === userId ? message.receiver : message.sender;

      if (otherUser.role !== 'CLIENT') return null;

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
    })
  );

  return chatList.filter(Boolean);
};



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

