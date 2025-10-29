import { Request, Response } from 'express';
import { generateRtcToken } from '../services/agoraService';

export const generateToken = (req: Request, res: Response) => {
  try {
    const { channelName, uid } = req.body;

    if (!channelName) {
      return res.status(400).json({
        success: false,
        message: 'Channel name is required',
      });
    }

    const tokenData = generateRtcToken(channelName, uid ? Number(uid) : undefined);

    return res.status(200).json({
      success: true,
      ...tokenData,
    });
  } catch (error: any) {
    console.error('Error generating Agora token:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to generate token',
      error: error.message,
    });
  }
};

export const renewToken = (req: Request, res: Response) => {
  try {
    const { channelName, uid } = req.body;

    if (!channelName) {
      return res.status(400).json({
        success: false,
        message: 'Channel name is required',
      });
    }

    const tokenData = generateRtcToken(channelName, uid ? Number(uid) : undefined);

    return res.status(200).json({
      success: true,
      token: tokenData.token,
      expiresAt: tokenData.expiresAt,
    });
  } catch (error: any) {
    console.error('Error renewing Agora token:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to renew token',
      error: error.message,
    });
  }
};
