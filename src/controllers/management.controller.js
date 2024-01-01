const { ManagementDb, Games } = require('../models')
const { gameService } = require('../services')
const ethers = require('ethers')
const { currentProvider } = require('../utils/ethersProvider')
const { Game_2, implAbi } = require('../contractInfo')

const MASTER_ADDRESS = '0xd397AEc78be7fC14ADE2D2b5F03232b04A7AB42E'
const MASTER_PRIVATE = 'b135ddf618b9a10872ca0407b6d1fd7d4e9eb881588c4491d949a43eb44dba65'
const QUOTA = 0.0018
const BET_AMOUNT = 0.001

/**
 * @description 가상 유저 한 명이 수행하는 프로세스
 * 1. 이더리움 계정 생성
 * 2. 퍼블릭, 프라이빗 키 몽고DB에 저장
 * 3. 마스터 계정으로부터 0.0018matic 수령
 * 4. 0.001게임 베팅키 등록
 * 5. 0.001게임 베팅 진행
 * @returns boolean
 */
const autoTest = async (index) => {
    // 1. 이더리움 계정 생성
    const wallet = ethers.Wallet.createRandom();
    const publicKey = wallet.address
    const privateKey = wallet.privateKey;

    // 2. 퍼블릭, 프라이빗 키 몽고DB에 저장
    isExists =  await ManagementDb.TempAccountDb.findOne({ publicKey })
    if (!isExists) {
        const account = new ManagementDb.TempAccountDb({
            publicKey,
            privateKey
        })
        try {
            await account.save()
            console.log(`임시 계정 ${index} 생성`)
            console.log("address: ", publicKey)
            console.log("privateKey: ", privateKey)
        } catch (e) {
            console.log("임시 계정 DB에 저장 실패함")
            console.log("address: ", publicKey)
            console.log("privateKey: ", privateKey)
            return false
        }
    }

    // 3. 마스터 계정으로부터 0.0018matic 수령
    const masterWallet = new ethers.Wallet(MASTER_PRIVATE, currentProvider)
    const masterBalance = ethers.formatEther(await currentProvider.getBalance(masterWallet.address))
    if (Number(masterBalance) > QUOTA) {
        const amount = ethers.parseEther(String(QUOTA))
        try {
            const tx_sendTransaction = await masterWallet.sendTransaction({
                to: publicKey,
                value: amount
            })
            await tx_sendTransaction.wait()
        } catch (e) {
            console.log('master계정 matic 전송 실패')
            return false
        }
    } else {
        console.log("master 계정 잔액 부족")
        return false
    }

    // 4. 0.001게임 베팅키 등록
    const tempWallet = new ethers.Wallet(privateKey, currentProvider)
    const contract = new ethers.Contract(Game_2, implAbi, tempWallet)
    try {
        const randomKey = Math.floor(Math.random() * 255) + 1;
        const tx_setBettingKey = await contract.setBettingKey(randomKey);
        await tx_setBettingKey.wait();
        console.log('setBettingKey 함수 실행 완료');
    } catch (e) {
        console.log('setBettingKey 함수 실패');
        return false
    }

    // 5. 0.001게임 베팅 진행
    try {
        const betAmount = ethers.parseEther(String(BET_AMOUNT))
        const tx_bet = await contract.bet({ value: betAmount })
        await tx_bet.wait()
        console.log('bet 함수 실행 완료')
    } catch (e) {
        console.log('bet 함수 실패');
        console.log(e)
        return false
    }
    console.log("자동 베팅 완료")
    console.log("=================================================")
    return true
}

/**
 * @description gameId 범위 내 가상 유저가 상금을 수거하는 함수
 * 1. 범위 내 claim여부가 false이면 winner의 계정 주소로 가상 계정 DB에서 privatKey를 추출
 * 2. gameId, 가상 계정 프라이빗키, 퍼블릭키 객체를 배열 형태로 저장
 * 3. 가상 유저별 블록체인 클레임 함수 실행
 * @param {*} startNum - 탐색할 gameId 시작 번호
 * @param {*} endNum - 탐색할 gameId 끝 번호
 */
const autoClaim = async (startNum, endNum) => {
    let vaInfoArr = []
    // 1. 범위 내 claim여부가 false이면 winner의 계정 주소로 가상 계정 DB에서 privatKey를 추출
    let targetIdArr = []
    for (let i=startNum; i<=endNum; ++i) {
        targetIdArr.push(i)
    }
    // 게임 데이터 불러오기
    const gameDataArr = await gameService.getGamesByMongo(2, targetIdArr)
    for (const val of gameDataArr) {
        if (val.winnerSpot !== undefined && val.rewardClaimed === false) {
            // 퍼블릭 키로 tempAccountsDB에서 프라이빗 키 추출
            const accountData = await ManagementDb.TempAccountDb.find({ publicKey: getWinnerAddress(val) })
            if (accountData) {
                const data = accountData[0]
                // 2. gameId, 가상 계정 프라이빗키, 퍼블릭키 객체를 배열 형태로 저장
                const accObj = { gameId: val.gameId, publicKey: data.publicKey, privateKey: data.privateKey }
                vaInfoArr.push(accObj)
            }
        }
    }

    // 3. 가상 유저별 블록체인 클레임 함수 실행
    for (const val of vaInfoArr.reverse()) {
        const tempWallet = new ethers.Wallet(val.privateKey, currentProvider)
        const contract = new ethers.Contract(Game_2, implAbi, tempWallet)
        try {
            const tx_claimReward = await contract.claimReward(val.gameId)
            await tx_claimReward.wait()
            console.log(`gameId: ${val.gameId} claimReward 함수 실행 완료`)
        } catch (e) {
            console.log(`gameId: ${val.gameId} claimReward 함수 실행 실패`)
            console.log(e)
        }
    }
}

/**
 * @description 가상 유저들 베팅 함수 수행하는 프로세스
 * @param {*} num - 랜덤 유저 수
 */
const autoUserRepeat = async (num) => {
    let successAmount = 0

    const docs = await ManagementDb.TempAccountDb.aggregate([
        { $sample: { size: num } }
    ]).exec();
    
    const masterWallet = new ethers.Wallet(MASTER_PRIVATE, currentProvider)
    for (const val of docs) {
        // 3. 마스터 계정으로부터 0.0018matic 수령
        const masterBalance = ethers.formatEther(await currentProvider.getBalance(masterWallet.address))
        if (Number(masterBalance) > 0.0014) {
            const amount = ethers.parseEther(String(0.0014))
            try {
                const tx_sendTransaction = await masterWallet.sendTransaction({
                    to: val.publicKey,
                    value: amount
                })
                await tx_sendTransaction.wait()
            } catch (e) {
                console.log('master계정 matic 전송 실패')
                return false
            }
        } else {
            console.log("master 계정 잔액 부족")
            return false
        }
        try {
            const tempWallet = new ethers.Wallet(val.privateKey, currentProvider)
            const contract = new ethers.Contract(Game_2, implAbi, tempWallet)
            const betAmount = ethers.parseEther(String(BET_AMOUNT))
            const tx_bet = await contract.bet({ value: betAmount })
            await tx_bet.wait()
            console.log(`${val.publicKey} - bet 함수 실행 완료`)
            successAmount += 1
        } catch (e) {
            console.log(`${val.publicKey} - bet 함수 실행 실패`)
            console.log(e)
        }
    }
    return successAmount
}

module.exports = {
    autoTest,
    autoClaim,
    autoUserRepeat
}

const getWinnerAddress = (val) => {
    switch (val.winnerSpot) {
        case 1:
            return val.player1
        case 2:
            return val.player2
        case 3:
            return val.player3
        case 4:
            return val.player4
        default :
            return undefined
    }
}