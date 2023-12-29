const { ManagementDb }= require('../models')

const increaseRoute = async (req, _, next) => {
    let routeName = req.path;
    routeName = routeName.slice(1);

    const filter = {}; // 모든 문서에 적용
    const update = { $inc: { [routeName]: 1 } };
    const options = { upsert: true, new: true }; // 문서가 없으면 새로 만들고, 업데이트된 문서를 반환

    try {
        await ManagementDb.findOneAndUpdate(filter, update, options);
    } catch (e) {
        console.log('miiddlewares/management increaseRoute error: ', e)
    }
    
    next();
  }

module.exports = {
    increaseRoute
  }