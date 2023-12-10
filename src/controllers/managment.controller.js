const { gameService, redisService } = require("../services");
const { ManagementDb }= require('../models')

async function increasePrefix(prefix) {
    const filter = {}; // 모든 문서에 적용
    const update = { $inc: { [prefix]: 1 } };
    const options = { upsert: true, new: true }; // 문서가 없으면 새로 만들고, 업데이트된 문서를 반환
    await ManagementDb.findOneAndUpdate(filter, update, options);
}

const increaseRoute = (prefix) => async (_, __, next) => {
    try {
        await increasePrefix(prefix)
    } catch (e) {
        console.log('management controller increaseRoute error: ', e)
    }
    return next();
}

module.exports = {
    increaseRoute
}