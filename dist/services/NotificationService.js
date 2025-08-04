"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationService = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
class NotificationService {
    async createNotification(userId, message, type) {
        return prisma.notification.create({
            data: {
                userId,
                message,
                type,
                read: false,
            },
        });
    }
    async getUserNotifications(userId) {
        return prisma.notification.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
        });
    }
    async markAsRead(notificationId) {
        return prisma.notification.update({
            where: { id: notificationId },
            data: { read: true },
        });
    }
}
exports.NotificationService = NotificationService;
