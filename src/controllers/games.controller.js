const httpStatus = require("http-status");

const test = (req, res) => {
    accessToken = 1234
    res.status(httpStatus.OK).send({ accessToken })
}

module.exports = {
    test,
}