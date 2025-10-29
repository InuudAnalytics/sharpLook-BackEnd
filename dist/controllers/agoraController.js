"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.renewToken = exports.generateToken = void 0;
const agoraService_1 = require("../services/agoraService");
const generateToken = (req, res) => {
    try {
        const { channelName, uid } = req.body;
        if (!channelName) {
            return res.status(400).json({
                success: false,
                message: 'Channel name is required',
            });
        }
        const tokenData = (0, agoraService_1.generateRtcToken)(channelName, uid ? Number(uid) : undefined);
        return res.status(200).json({
            success: true,
            ...tokenData,
        });
    }
    catch (error) {
        console.error('Error generating Agora token:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to generate token',
            error: error.message,
        });
    }
};
exports.generateToken = generateToken;
const renewToken = (req, res) => {
    try {
        const { channelName, uid } = req.body;
        if (!channelName) {
            return res.status(400).json({
                success: false,
                message: 'Channel name is required',
            });
        }
        const tokenData = (0, agoraService_1.generateRtcToken)(channelName, uid ? Number(uid) : undefined);
        return res.status(200).json({
            success: true,
            token: tokenData.token,
            expiresAt: tokenData.expiresAt,
        });
    }
    catch (error) {
        console.error('Error renewing Agora token:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to renew token',
            error: error.message,
        });
    }
};
exports.renewToken = renewToken;
