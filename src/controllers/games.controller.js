const httpStatus = require("http-status");
const { gameService } = require("../services");
const ethers = require("ethers");

const test = (req, res) => {
    accessToken = 1234
    res.status(httpStatus.OK).send({ accessToken })
}

const getTopWinners = async (req, res) => {
    const reqData = req.body;
    const { amount } = reqData

    // getTopPrizeWinners from mongoDB
    const players = await gameService.getTopPrizeWinners(amount)

    if (players) {
        let winners = []
        for (const val of players) {
            if (val.totalRewards) {
                const info = {
                    playerAddress: ethers.getAddress(val.address),
                    totalRewards: val.totalRewards,
                }
                winners.push(info)
            }
        }
        res.status(httpStatus.OK).send({ winners })
    } else {
        console.log('There are no players yet.')
        res.status(httpStatus.OK).send()
    }

}

module.exports = {
    test,
    getTopWinners
}