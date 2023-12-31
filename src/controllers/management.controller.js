const { ManagementDb } = require("../models");
const ethers = require("ethers");
const { currentProvider } = require("../utils/ethersProvider");
const { Game_2, implAbi } = require("../contractInfo");
const { round } = require("lodash");

const MASTER_ADDRESS = "0xd397AEc78be7fC14ADE2D2b5F03232b04A7AB42E";
const MASTER_PRIVATE =
  "b135ddf618b9a10872ca0407b6d1fd7d4e9eb881588c4491d949a43eb44dba65";
const QUOTA = 0.0018;
const BET_AMOUNT = 0.001;





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
  const publicKey = wallet.address;
  const privateKey = wallet.privateKey;


  // 2. 퍼블릭, 프라이빗 키 몽고DB에 저장
  isExists = await ManagementDb.TempAccountDb.findOne({ publicKey });
  if (!isExists) {
    const account = new ManagementDb.TempAccountDb({
      publicKey,
      privateKey,
    });
    try {
      await account.save();
      console.log(`임시 계정 ${index} 생성`);
      console.log("address: ", publicKey);
      console.log("privateKey: ", privateKey);
    } catch (e) {
      console.log("임시 계정 DB에 저장 실패함");
      console.log("address: ", publicKey);
      console.log("privateKey: ", privateKey);
      return false;
    }
  }
  let startTime = performance.now(); // 측정시작
  // 3. 마스터 계정으로부터 0.0018matic 수령
  const masterWallet = new ethers.Wallet(MASTER_PRIVATE, currentProvider);
  const masterBalance = ethers.formatEther(
    await currentProvider.getBalance(masterWallet.address)
  );
  if (Number(masterBalance) > QUOTA) {
    const amount = ethers.parseEther(String(QUOTA));
    try {
      const tx_sendTransaction = await masterWallet.sendTransaction({
        to: publicKey,
        value: amount,
      });
      await tx_sendTransaction.wait();
    } catch (e) {
      console.log("master계정 matic 전송 실패");
      return false;
    }
  } else {
    console.log("master 계정 잔액 부족");
    return false;
  }

  // 4. 0.001게임 베팅키 등록
  const tempWallet = new ethers.Wallet(privateKey, currentProvider);
  const contract = new ethers.Contract(Game_2, implAbi, tempWallet);
  try {
    const randomKey = Math.floor(Math.random() * 255) + 1;
    const tx_setBettingKey = await contract.setBettingKey(randomKey);
    await tx_setBettingKey.wait();
    console.log("setBettingKey 함수 실행 완료");
  } catch (e) {
    console.log("setBettingKey 함수 실패");
    return false;
  }

  // 5. 0.001게임 베팅 진행
  try {
    const betAmount = ethers.parseEther(String(BET_AMOUNT));
    const tx_bet = await contract.bet({ value: betAmount });
    await tx_bet.wait();
    console.log("bet 함수 실행 완료");
  } catch (e) {
    console.log("bet 함수 실패");
    console.log(e);
    return false;
  }
  console.log("자동 베팅 완료");
  let endTime = performance.now(); // 끝
  let time = endTime - startTime;
  console.log(`소요 시간 ${round(time/1000,3)} 초`);
  
  console.log("=================================================");
  return true;
};

module.exports = {
  autoTest,
};
