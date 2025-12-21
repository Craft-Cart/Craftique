import { Response } from 'express';
import { config } from '../config/env';

export const setAuthCookie = (res: Response, token: string, refreshToken?: string) => {
  // Set access token in HttpOnly cookie
  res.cookie('access_token', token, {
    httpOnly: true,
    secure: config.cookie.secure,
    sameSite: config.cookie.sameSite,
    domain: config.cookie.domain,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    path: '/',
  });

  // Set refresh token if provided
  if (refreshToken) {
    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: config.cookie.secure,
      sameSite: config.cookie.sameSite,
      domain: config.cookie.domain,
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      path: '/',
    });
  }
};

export const clearAuthCookies = (res: Response) => {
  res.clearCookie('access_token', {
    domain: config.cookie.domain,
    path: '/',
  });
  res.clearCookie('refresh_token', {
    domain: config.cookie.domain,
    path: '/',
  });
};

