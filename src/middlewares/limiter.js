const rateLimit = require('express-rate-limit');

// Rate limiter 설정
const limiter = rateLimit({
  windowMs: 3 * 1000, // 1 seconds
  max: 20, // limit each IP to 50 requests per windowMs
  handler(_, res) {
    res.status(429).json({ errorMsg: 'Too many requests' });
  },
});

module.exports = {
  limiter
}