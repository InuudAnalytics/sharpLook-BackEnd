"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAdminRole = void 0;
const client_1 = require("@prisma/client"); // Adjust if needed based on your enum setup
// Middleware factory to restrict access to specific admin roles
const requireAdminRole = (...allowedRoles) => {
    return (req, res, next) => {
        try {
            const user = req.user; // Ensure `verifyToken` ran before this middleware
            if (!user) {
                return res.status(401).json({ message: "Unauthorized. No user info found." });
            }
            if (user.role !== client_1.Role.ADMIN && user.role !== client_1.Role.SUPERADMIN) {
                return res.status(403).json({ message: "Access denied. Not an admin user." });
            }
            const userAdminRole = user.adminRole;
            console.log(userAdminRole);
            // if (!allowedRoles.includes(userAdminRole)) {
            //   return res.status(403).json({
            //     message: `Access denied. Required roles: [${allowedRoles.join(", ")}], but you have: ${userAdminRole}`,
            //   });
            // }
            next();
        }
        catch (err) {
            console.error("Admin role middleware error:", err);
            return res.status(500).json({ message: "Server error in role check middleware." });
        }
    };
};
exports.requireAdminRole = requireAdminRole;
