const httpStatus = require('http-status')
const ethers = require('ethers');
const { eventService } = require("../services");

const abiCoder = new ethers.AbiCoder
// BigNumber로 변환하는 함수
const toBigNumber = (hexString) => ethers.toNumber(hexString);

// 지갑 주소로 변환하는 함수
const toWalletAddress = (hexString) => abiCoder.decode(['address'], hexString);

// Stream ID 유효성 검사
const validateStreamId = (id) => {
    const env = process.env
    const isAuth = (id === env.MORALIS_STREAM_ID_BET)
    return isAuth
}

const getWebhooks = async (_, res) => {
 
};

const sendRandomReward = async (req, res) => {
    const betEventData = req.body.logs[0]
    console.log("gameId: ", toBigNumber(betEventData.topic1).toString())
    console.log("player: ", toWalletAddress(betEventData.topic2).toString())
    console.log("spot: ", toBigNumber(betEventData.topic3).toString())

    console.log("-----------------------------------")
    res.status(httpStatus.OK).send()
};

// Bet 이벤트 log 저장 함수
// gameId, player, spot
const getBetEvent = async (req, res) => {
    const webhookData = req.body
    const { confirmed, streamId, logs } = webhookData
    
    if (!validateStreamId(streamId)) {
        console.log('Unauthorized stream id')
        res.status(httpStatus.UNAUTHORIZED).send()
    }

    if (!confirmed) {
        if (logs?.length > 0) {
            try {
                const { address: contractAddress, topic1, topic2, topic3 } = logs[0]
                const obj = {
                    contractAddress: contractAddress,
                    gameId: toBigNumber(topic1),
                    playerAddress: toWalletAddress(topic2).toString(),
                    spot: toBigNumber(topic3)
                }
                
                if (await eventService.updateGamePlayer(obj)) {
                    return res.status(httpStatus.OK).send({ message: 'Update game information'})
                } else {
                    console.log("error: 잘못된 컨트랙 주소")
                    return res.status(httpStatus.UNAUTHORIZED).send({ message: 'Invalid contract address'})
                }
    
            } catch (e) {
                console.log(e)
                return res.status(httpStatus.INTERNAL_SERVER_ERROR).send({ error: e.message })
            }
        }
    }
    // blockchain confirmed
    return res.status(httpStatus.OK).send({ message: "No logs found" })
}

// EnterFirstPlayer 이벤트 log 저장 함수
// gameId, blocknumber, spot
const getEfpEvent = async (req, res) => {

}

// ClaimReward 이벤트 log 저장 함수
// gameId, player, value
const getCliaimRewardEvent = async (req, res) => {

}

// ChangedManagement 이벤트 log 저장 함수
// address
const getChangeManagementEvent = async (req, res) => {

}

module.exports = {
  getWebhooks,
  sendRandomReward,
  getBetEvent,
};


// sample
// {
//     confirmed: true,
//     chainId: '0x13881',
//     abi: [
//       { anonymous: false, inputs: [Array], name: 'Bet', type: 'event' },
//       {
//         anonymous: false,
//         inputs: [Array],
//         name: 'ChangedManagement',
//         type: 'event'
//       },
//       {
//         anonymous: false,
//         inputs: [Array],
//         name: 'ClaimReward',
//         type: 'event'
//       },
//       {
//         anonymous: false,
//         inputs: [Array],
//         name: 'EnterFirstPlayer',
//         type: 'event'
//       },
//       {
//         anonymous: false,
//         inputs: [Array],
//         name: 'Initialized',
//         type: 'event'
//       },
//       {
//         anonymous: false,
//         inputs: [Array],
//         name: 'OwnershipTransferred',
//         type: 'event'
//       },
//       {
//         anonymous: false,
//         inputs: [Array],
//         name: 'Paused',
//         type: 'event'
//       },
//       {
//         anonymous: false,
//         inputs: [Array],
//         name: 'RoleAdminChanged',
//         type: 'event'
//       },
//       {
//         anonymous: false,
//         inputs: [Array],
//         name: 'RoleGranted',
//         type: 'event'
//       },
//       {
//         anonymous: false,
//         inputs: [Array],
//         name: 'RoleRevoked',
//         type: 'event'
//       },
//       {
//         anonymous: false,
//         inputs: [Array],
//         name: 'Unpaused',
//         type: 'event'
//       }
//     ],
//     streamId: 'a0adecc8-5046-4353-ab63-f0f80bc3eb5b',
//     tag: 'demod',
//     retries: 0,
//     block: {
//       number: '40859170',
//       hash: '0x4cbf775aa7202f20dd257e6289e3ddd14caed19726e4d0f7c4f3e78531f6fb58',
//       timestamp: '1696495474'
//     },
    // logs: [
    //   {
    //     logIndex: '10',
    //     transactionHash: '0x508b75496f47142a244a218559f2de618a383252450a27cb7ed63475987c7984',
    //     address: '0x936723a26e92c5ccd26f35732aa79fa723ef531d',
    //     data: '0x',
    //     topic0: '0xca49f418dd97ad76b84ed6fb8e915ecccb519c5379cf6a4a455c2be7618fda2f',
    //     topic1: '0x0000000000000000000000000000000000000000000000000000000000000002',
    //     topic2: '0x0000000000000000000000002cc285279f6970d00f84f3034439ab8d29d04d97',
    //     topic3: '0x0000000000000000000000000000000000000000000000000000000000000002'
    //   }
    // ],
//     txs: [],
//     txsInternal: [],
//     erc20Transfers: [],
//     erc20Approvals: [],
//     nftTokenApprovals: [],
//     nftApprovals: { ERC721: [], ERC1155: [] },
//     nftTransfers: [],
//     nativeBalances: []
//   }