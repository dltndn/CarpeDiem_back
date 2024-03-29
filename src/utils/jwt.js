const jwt = require('jsonwebtoken');

const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET;
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET;

const generateJWT = function (metadata = {}, secretKey, options) {
  return jwt.sign(metadata, secretKey, options);
};

const createAccessToken = function (userId, metadata) {
  return generateJWT({ userId, ...metadata }, ACCESS_TOKEN_SECRET, { expiresIn: '30m' });
};

const createRefreshToken = function (userId) {
  return generateJWT({ userId }, REFRESH_TOKEN_SECRET, { expiresIn: '14d' });
};

const verifyAccessToken = (token) => jwt.verify(token, ACCESS_TOKEN_SECRET);

const verifyRefreshToken = (token) => jwt.verify(token, REFRESH_TOKEN_SECRET);

const refreshTokenCookieOptions = {
  secure: process.env.NODE_ENV === 'production',
  signed: true,
  httpOnly: true,
  path: '/',
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'Lax',
};

const accessTokenCookieOptions = {
  secure: process.env.NODE_ENV === 'production',
  signed: true,
  httpOnly: true,
  path: '/',
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'Lax',
};

if (process.env.NODE_ENV === 'development') {
  refreshTokenCookieOptions.domain = 'localhost';
  accessTokenCookieOptions.domain = 'localhost';
} else if (process.env.NODE_ENV === 'production') {
  refreshTokenCookieOptions.domain = process.env.SERVER_DOMAIN;
  accessTokenCookieOptions.domain = process.env.SERVER_DOMAIN;
}

module.exports = {
  createAccessToken,
  createRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  refreshTokenCookieOptions,
  accessTokenCookieOptions,
};