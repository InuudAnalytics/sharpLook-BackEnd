"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateRtcToken = void 0;
const agora_access_token_1 = require("agora-access-token");
const AGORA_APP_ID = process.env.AGORA_APP_ID || 'your_agora_app_id';
const AGORA_APP_CERTIFICATE = process.env.AGORA_APP_CERTIFICATE || 'your_agora_app_certificate';
const PRIVILEGE_EXPIRATION_TIME = 86400; // 24 hours in seconds
const generateRtcToken = (channelName, uid) => {
    const numericUid = uid ?? 0;
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const privilegeExpiredTs = currentTimestamp + PRIVILEGE_EXPIRATION_TIME;
    const token = agora_access_token_1.RtcTokenBuilder.buildTokenWithUid(AGORA_APP_ID, AGORA_APP_CERTIFICATE, channelName, numericUid, agora_access_token_1.RtcRole.PUBLISHER, privilegeExpiredTs);
    return {
        token,
        channelName,
        uid: numericUid,
        expiresAt: privilegeExpiredTs,
    };
};
exports.generateRtcToken = generateRtcToken;
