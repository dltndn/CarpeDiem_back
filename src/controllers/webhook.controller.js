const httpStatus = require("http-status");
const ethers = require("ethers");
const { eventService, redisService } = require("../services");
const { Games } = require("../models")

const abiCoder = new ethers.AbiCoder();
// BigNumber로 변환하는 함수
const toBigNumber = (hexString) => ethers.toNumber(hexString);

// 지갑 주소로 변환하는 함수
const toWalletAddress = (hexString) => abiCoder.decode(["address"], hexString);

// ether수량 단위로 변환하는 함수
const toEtherAmount = (hexString) => ethers.formatEther(ethers.getBigInt(hexString))

// Stream ID 유효성 검사
const validateStreamId = (id) => {
  const env = process.env;
  const isAuth =
    id === env.MORALIS_STREAM_ID_BET || id === env.MORALIS_STREAM_ID_EFP || id === env.MORALIS_STREAM_ID_CLAIMREWARD;
  if (!isAuth) {
    console.log("Unauthorized stream id");
    console.log("Recieved: ", id);
    return false
  }
  return isAuth;
};

const getWebhooks = async (_, res) => {};

const sendRandomReward = async (req, res) => {
  const betEventData = req.body.logs[0];
  console.log("gameId: ", toBigNumber(betEventData.topic1).toString());
  console.log("player: ", toWalletAddress(betEventData.topic2).toString());
  console.log("spot: ", toBigNumber(betEventData.topic3).toString());

  console.log("-----------------------------------");
  res.status(httpStatus.OK).send();
};

// Bet 이벤트 log 저장 함수
// gameId, player, spot
const getBetEvent = async (req, res) => {
  const webhookData = req.body;
  const { confirmed, streamId, logs } = webhookData;

  if (!validateStreamId(streamId)) {
    return res.status(httpStatus.UNAUTHORIZED).send();
    // return res.status(httpStatus.OK).send()
  }

  if (!confirmed) {
    if (logs?.length > 0) {
      try {
        const { address: contractAddress, topic1, topic2, topic3 } = logs[0];
        const obj = {
          contractAddress: contractAddress,
          gameId: toBigNumber(topic1),
          playerAddress: toWalletAddress(topic2).toString(),
          spot: toBigNumber(topic3),
        };

        if (await eventService.updateGamePlayer(obj)) {
          return res
            .status(httpStatus.OK)
            .send({ message: "Update game information" });
        } else {
          console.log("webhook getBetEvent error: 잘못된 컨트랙 주소");
          return res
            .status(httpStatus.UNAUTHORIZED)
            .send({ message: "Invalid contract address" });
        }
      } catch (e) {
        console.log(e);
        return res
          .status(httpStatus.INTERNAL_SERVER_ERROR)
          .send({ error: e.message });
      }
    }
  }
  // blockchain confirmed
  return res.status(httpStatus.OK).send({ message: "No logs found" });
};

// EnterFirstPlayer 이벤트 log 저장 함수
// gameId, resultHash, spot
const getEfpEvent = async (req, res) => {
  const webhookData = req.body;
  const { confirmed, streamId, logs } = webhookData;

  if (!validateStreamId(streamId)) {
    return res.status(httpStatus.UNAUTHORIZED).send();
    // return res.status(httpStatus.OK).send()
  }

  if (!confirmed) {
    if (logs?.length > 0) {
      try {
        const { address: contractAddress, topic1, topic2, topic3 } = logs[0];
        const obj = {
          contractAddress: contractAddress,
          gameId: toBigNumber(topic1),
          resultHash: topic2.toString(),
          spot: toBigNumber(topic3),
        };

        if (await eventService.insertWinnerInfo(obj)) {
            const contractKey = eventService.findKeyByAddress(obj.contractAddress)
          // redis에 넣을 데이터
          const dbUpdatedGame = await Games[contractKey].findOne({
            gameId: obj.gameId,
          });

          const updatedGame = {
            gameId: dbUpdatedGame.gameId,
            player1: dbUpdatedGame.player1,
            player2: dbUpdatedGame.player2,
            player3: dbUpdatedGame.player3,
            player4: dbUpdatedGame.player4,
            winnerSpot: dbUpdatedGame.winnerSpot
          }

          const isMemorySpace = await redisService.isMemorySpaceAvailable();
          // redis 용량 관리를 위한 오래된 메모리 삭제
          if (!isMemorySpace) {
            // 오래된 게임 데이터 3개 삭제
            await redisService.removeDatas();
          }

          // redis 입력
          await redisService.setData(
            `${contractKey}:${updatedGame.gameId}`,
            contractKey,
            updatedGame.gameId,
            updatedGame
          );
          return res
            .status(httpStatus.OK)
            .send({ message: "Update game winner information" });
        } else {
          console.log("webhook getEfpEvent error: 잘못된 컨트랙 주소");
          return res
            .status(httpStatus.UNAUTHORIZED)
            .send({ message: "Invalid contract address" });
        }
      } catch (e) {
        console.log(e);
        return res
          .status(httpStatus.INTERNAL_SERVER_ERROR)
          .send({ error: e.message });
      }
    }
  }
  // blockchain confirmed
  return res.status(httpStatus.OK).send({ message: "No logs found" });
};

// ClaimReward 이벤트 log 저장 함수
// gameId, player, value
const getCliaimRewardEvent = async (req, res) => {
    const webhookData = req.body;
    const { confirmed, streamId, logs } = webhookData;

    if (!validateStreamId(streamId)) {
      return res.status(httpStatus.UNAUTHORIZED).send();
      // return res.status(httpStatus.OK).send()
    }
    
    if (!confirmed) {
        if (logs?.length > 0) {
          try {
            const { address: contractAddress, topic1, topic2, topic3 } = logs[0];
            const obj = {
              contractAddress: contractAddress,
              gameId: toBigNumber(topic1),
              playerAddress: toWalletAddress(topic2).toString(),
              claimRewards: toEtherAmount(topic3),
            };
    
            // 해당 game rewardClaimed true로 변경
            // 해당 유저 claimReawards 증가
            if (await eventService.updateClaimRewardsInfo(obj)) {
                return res
                  .status(httpStatus.OK)
                  .send({ message: "Update game information" });
              } else {
                console.log("webhook getCliaimRewardEvent error: 잘못된 컨트랙 주소");
                return res
                  .status(httpStatus.UNAUTHORIZED)
                  .send({ message: "Invalid contract address" });
              }            

          } catch (e) {
            console.log(e);
            return res
              .status(httpStatus.INTERNAL_SERVER_ERROR)
              .send({ error: e.message });
          }
        }
      }
      // blockchain confirmed
      return res.status(httpStatus.OK).send({ message: "No logs found" });
};

// ChangedManagement 이벤트 log 저장 함수
// address
const getChangeManagementEvent = async (req, res) => {};

const sampleData = {
  gameId: 10,
  player1: "0x1e1864802DcF4A0527EF4315Da37D135f6D1B64B",
  player2: "0x1e1864802DcF4A0527EF4315Da37D135f6D1B64B",
  player3: "0x521D5d2d40C80BAe1fec2e75B76EC03eaB82b4E0",
  player4: "0xd397AEc78be7fC14ADE2D2b5F03232b04A7AB42E",
  winnerSpot: 2,
};

const test = async (req, res) => {
  console.log("setData: ", await redisService.setData("test1", sampleData));
  res.status(httpStatus.OK).send();
};

const test2 = async (req, res) => {
  const result = await redisService.getDatas(["Game_2:12", "Game_2:13"]);
  console.log("result: ", result);
  res.status(httpStatus.OK).send();
};

const test3 = async (req, res) => {
  await redisService.removeDatas();
  res.status(httpStatus.OK).send();
};

const test4 = async (req, res) => {
  // const isMemorySpaceAvailable = await redisService.isMemorySpaceAvailable()
  // console.log('isMemorySpaceAvailable: ' ,isMemorySpaceAvailable)
  const data = req.body
  const { index } = data
  switch(index) {
    case 0: 
      const result = await redisService.getAllGameKeys()
      console.log("result: ", result)
      break
    case 1:
      await redisService.setData('Game_3:10', 'Game_3', 10, sampleData)
      break
    case 2:
      const result2 = await redisService.getDatas('Game_3', 3, 1)
      console.log("result2: ", result2)
      break
    case 3:
      await redisService.removeDatas()
      break
    case 4:
      await redisService.isMemorySpaceAvailable()
      break
    default:
      console.log('?')
  }
  
  res.status(httpStatus.OK).send();
};

module.exports = {
  getWebhooks,
  sendRandomReward,
  getBetEvent,
  getEfpEvent,
  getCliaimRewardEvent,
  test,
  test2,
  test3,
  test4,
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
