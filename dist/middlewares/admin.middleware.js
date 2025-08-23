"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAdminRole = void 0;
// Middleware factory to restrict access to specific roles
const requireAdminRole = (...allowedRoles) => {
    return (req, res, next) => {
        try {
            const user = req.user; // Ensure `verifyToken` middleware runs first
            if (!user) {
                return res.status(401).json({ message: "Unauthorized. No user info found." });
            }
            if (!allowedRoles.includes(user.role)) {
                return res.status(403).json({
                    message: `Access denied. Required roles: [${allowedRoles.join(", ")}], but you have: ${user.role}`,
                });
            }
            next();
        }
        catch (err) {
            console.error("Role middleware error:", err);
            return res.status(500).json({ message: "Server error in role check middleware." });
        }
    };
};
exports.requireAdminRole = requireAdminRole;
