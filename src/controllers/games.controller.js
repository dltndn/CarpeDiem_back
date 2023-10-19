const httpStatus = require("http-status");

const test = (req, res) => {
    accessToken = 1234
    res.status(httpStatus.OK).send({ accessToken })
}

const getTopWinners = (req, res, next) => {

}

module.exports = {
    test,
}