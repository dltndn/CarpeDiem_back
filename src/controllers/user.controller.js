const { userService } = require("../services");
const httpStatus = require("http-status");
const {
  createAccessToken,
  createRefreshToken,
  refreshTokenCookieOptions,
  accessTokenCookieOptions,
} = require("../utils/jwt");

const login = async (req, res) => {
  const { address } = req.body;
  // 지갑 주소로 DB에서 데이터 불러오기
  let user = await userService.getUserByAddress(address);

  // DB에 존재하지 않으면 새로 만들기
  if (!user) {
    user = await userService.createUser(address);
  }

  // nonce 값만 반환
  res.status(httpStatus.OK).send({ nonce: user.nonce });
};

const verifySignature = async (req, res) => {
  const { address, signature } = req.body;

  const user = await userService.getUserByAddress(address);

  if (user) {
    const { _id: userId, nonce } = user;
    try {
      const isVerified = await userService.verify({
        address,
        signature,
        nonce,
      });
      if (isVerified) {
        // 검증을 성공할 때마다 DB nonce값 업데이트
        await userService.updateNonce(userId);

        const accessToken = createAccessToken(userId, {
          address: user?.address,
        });
        const refreshToken = createRefreshToken(userId);

        res.header('Access-Control-Allow-Credentials', true);
        res.header('Access-Control-Allow-Origin', process.env.FRONT_ADDRESS);

        // client의 쿠키에 보관
        res.cookie("accessToken", accessToken, accessTokenCookieOptions);
        res.cookie("refreshToken", refreshToken, refreshTokenCookieOptions);

        await userService.updateRefreshToken(userId, refreshToken);

        return res.status(httpStatus.OK).send({ accessToken });
      }

      return res
        .status(httpStatus.UNAUTHORIZED)
        .send({ error: "Signature verification failed" });
    } catch (e) {
      return res
        .status(httpStatus.INTERNAL_SERVER_ERROR)
        .send({ error: "User not found" });
    }
  }
};

const logout = async (_, res) => {
  res.header('Access-Control-Allow-Credentials', true);
  res.header('Access-Control-Allow-Origin', process.env.FRONT_ADDRESS);
  res.clearCookie("accessToken", accessTokenCookieOptions);
  res.clearCookie("refreshToken", refreshTokenCookieOptions);
  res.status(httpStatus.OK).send();
};

const getUsers = async (_, res) => {
  const users = await userService.getAllUsers();
  res.status(httpStatus.OK).send({ users });
};

const updateAccessToken = async (req, res) => {
  const { address } = req.body;
  try {
    const user = await userService.getUserByAddress(address);
    if (user) {
      const { _id: userId } = user;

      const accessToken = createAccessToken(userId, { address: user?.address });
      const refreshToken = createRefreshToken(userId);

      res.header('Access-Control-Allow-Credentials', true);
      res.header('Access-Control-Allow-Origin', '*');

      // client의 쿠키에 보관
      res.cookie("accessToken", accessToken, accessTokenCookieOptions);
      res.cookie("refreshToken", refreshToken, refreshTokenCookieOptions);
      await userService.updateRefreshToken(userId, refreshToken);

      return res.status(httpStatus.OK).send({ accessToken });
    }
  } catch (e) {
    return res
      .status(httpStatus.INTERNAL_SERVER_ERROR)
      .send({ error: "User not found" });
  }
};

module.exports = {
  login,
  verifySignature,
  logout,
  getUsers,
  updateAccessToken,
};
