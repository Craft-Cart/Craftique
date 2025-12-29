import { Response } from 'express';
import { config } from '../config/env';

export const setAuthCookie = (res: Response, token: string, refreshToken?: string) => {
  res.cookie('access_token', token, {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    domain: config.cookie.domain,
    maxAge: 24 * 60 * 60 * 1000,
    path: '/',
  });

  if (refreshToken) {
    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      domain: config.cookie.domain,
      maxAge: 30 * 24 * 60 * 60 * 1000,
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

