const { ethers } = require("ethers");

const uniswap = require("@studydefi/money-legos/uniswap");
const erc20 = require("@studydefi/money-legos/erc20");

const getDai = async (wallet) => {
  const daiContract = new ethers.Contract(erc20.dai.address, erc20.abi, wallet);

  const uniswapFactoryContract = new ethers.Contract(
    uniswap.factory.address,
    uniswap.factory.abi,
    wallet,
  );

  const daiExchangeAddress = await uniswapFactoryContract.getExchange(
    erc20.dai.address,
  );

  const daiExchangeContract = new ethers.Contract(
    daiExchangeAddress,
    uniswap.exchange.abi,
    wallet,
  );

  // do the actual swapping of 5 ETH to DAI
  console.log("Exchanging 5 ETH for DAI");
  await daiExchangeContract.ethToTokenSwapInput(
    1, // min amount of token retrieved
    2525644800, // random timestamp in the future (year 2050)
    {
      gasLimit: 4000000,
      value: ethers.utils.parseEther("5"),
    },
  );

  const daiAfter = await daiContract.balanceOf(wallet.address);
  console.log("DAI balance", ethers.utils.formatUnits(daiAfter, 18));
};

module.exports = getDai;
