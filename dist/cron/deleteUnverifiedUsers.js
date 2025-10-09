"use strict";
// import { PrismaClient } from '@prisma/client';
// import cron from 'node-cron';
Object.defineProperty(exports, "__esModule", { value: true });
// const prisma = new PrismaClient();
// const deleteOldUnverifiedUsers = async () => {
//   const oneMonthAgo = new Date();
//   oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
//   try {
//     const usersToDelete = await prisma.user.findMany({
//       where: {
//         isOtpVerified: false,
//         createdAt: {
//           lt: oneMonthAgo
//         }
//       },
//       select: {
//         id: true,
//         email: true
//       }
//     });
//     if (usersToDelete.length === 0) {
//       console.log('✅ No unverified users to delete today.');
//       return;
//     }
//     const userIds = usersToDelete.map(user => user.id);
//     await prisma.user.deleteMany({
//       where: {
//         id: { in: userIds }
//       }
//     });
//     usersToDelete.forEach(user =>
//       console.log(`🗑️ Deleted unverified user: ${user.email}`)
//     );
//   } catch (error) {
//     console.error('🚨 Error deleting unverified users:', error);
//   }
// };
// // ⏰ Run daily at 00:30 (30 mins after your other job)
// cron.schedule('30 0 * * *', () => {
//   console.log('🔁 Running daily cleanup of unverified users...');
//   deleteOldUnverifiedUsers();
// });
// // 👇 Optional: run immediately on script start
// deleteOldUnverifiedUsers();
