const { ethers } = require("ethers");

const uniswap = require("@studydefi/money-legos/uniswap");
const erc20 = require("@studydefi/money-legos/erc20");

const getEthBtcPrice = async (wallet) => {
  const uniswapFactoryContract = new ethers.Contract(
    uniswap.factory.address,
    uniswap.factory.abi,
    wallet,
  );

  const wbtcExchangeAddress = await uniswapFactoryContract.getExchange(
    erc20.wbtc.address,
  );

  const wbtcExchangeContract = new ethers.Contract(
    wbtcExchangeAddress,
    uniswap.exchange.abi,
    wallet,
  );

  const ethbtcWei = await wbtcExchangeContract.getEthToTokenInputPrice(
    ethers.utils.parseEther("1"),
  );

  const ethbtcPrice = ethers.utils.formatUnits(ethbtcWei, erc20.wbtc.decimals);
  return parseFloat(ethbtcPrice);
};

module.exports = getEthBtcPrice;
