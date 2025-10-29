import { RtcTokenBuilder, RtcRole } from 'agora-access-token';

const AGORA_APP_ID = process.env.AGORA_APP_ID || 'your_agora_app_id';
const AGORA_APP_CERTIFICATE = process.env.AGORA_APP_CERTIFICATE || 'your_agora_app_certificate';
const PRIVILEGE_EXPIRATION_TIME = 86400; // 24 hours in seconds

export const generateRtcToken = (channelName: string, uid?: number) => {
  const numericUid = uid ?? 0;
  const currentTimestamp = Math.floor(Date.now() / 1000);
  const privilegeExpiredTs = currentTimestamp + PRIVILEGE_EXPIRATION_TIME;

  const token = RtcTokenBuilder.buildTokenWithUid(
    AGORA_APP_ID,
    AGORA_APP_CERTIFICATE,
    channelName,
    numericUid,
    RtcRole.PUBLISHER,
    privilegeExpiredTs
  );

  return {
    token,
    channelName,
    uid: numericUid,
    expiresAt: privilegeExpiredTs,
  };
};
