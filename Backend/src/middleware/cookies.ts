import { Response } from 'express';
import { config } from '../config/env';

export const setAuthCookie = (res: Response, token: string, refreshToken?: string) => {
  console.log('[CookieMiddleware] setAuthCookie - Setting auth cookies');
  res.cookie('access_token', token, {
    httpOnly: true,
    secure: config.cookie.secure,
    sameSite: config.cookie.sameSite,
    domain: config.cookie.domain,
    maxAge: 24 * 60 * 60 * 1000,
    path: '/',
  });

  if (refreshToken) {
    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: config.cookie.secure,
      sameSite: config.cookie.sameSite,
      domain: config.cookie.domain,
      maxAge: 30 * 24 * 60 * 60 * 1000,
      path: '/',
    });
  }
  console.log('[CookieMiddleware] setAuthCookie - Cookies set successfully');
};

export const clearAuthCookies = (res: Response) => {
  console.log('[CookieMiddleware] clearAuthCookies - Clearing auth cookies');
  res.clearCookie('access_token', {
    domain: config.cookie.domain,
    path: '/',
  });
  res.clearCookie('refresh_token', {
    domain: config.cookie.domain,
    path: '/',
  });
  console.log('[CookieMiddleware] clearAuthCookies - Cookies cleared successfully');
};

