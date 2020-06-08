require("dotenv").config();
const { ethers } = require("ethers");

const uma = require("@studydefi/money-legos/uma");
const erc20 = require("@studydefi/money-legos/erc20");
const getDai = require("./utils/getDai");
const getEthBtcPrice = require("./utils/getEthBtcPrice");

const ethbtcEMPAddress = "0x3f2d9edd9702909cf1f8c4237b7c4c5931f9c944";
const privKey = process.env.PRIV_KEY;

const fromWei = (x, u = 18) => parseFloat(ethers.utils.formatUnits(x, u));
const toWei = (x, u = 18) => ethers.utils.parseUnits(x.toString(), u);

const main = async () => {
  // setup Ethers.js wallet
  const provider = new ethers.providers.JsonRpcProvider();
  const wallet = new ethers.Wallet(privKey, provider);

  // we need to get some DAI as collateral first
  await getDai(wallet);

  // and allow the EMP to move some of our DAI
  const daiContract = new ethers.Contract(
    erc20.dai.address,
    erc20.dai.abi,
    wallet,
  );
  await daiContract.approve(ethbtcEMPAddress, toWei("1000000"));

  // create ETH/BTC EMP instance
  const emp = new ethers.Contract(
    ethbtcEMPAddress,
    uma.expiringMultiParty.abi,
    wallet,
  );

  // global collateral amount = raw total collateral * cumulative fee multiplier
  const cumFeeMultiplier = fromWei(await emp.cumulativeFeeMultiplier());
  const totalCollateralRaw = await emp.rawTotalPositionCollateral();
  const totalCollateral = totalCollateralRaw.mul(cumFeeMultiplier);

  // collateral to tokens ratio = global collateral amount / total tokens
  const totalTokens = await emp.totalTokensOutstanding();
  const collateralToTokensRatio = fromWei(totalCollateral) / fromWei(totalTokens);

  console.log("\nCalculate Ratio of Collateral to Tokens");
  console.log("---------------------------------------");
  console.log("cumFeeMultiplier", cumFeeMultiplier.toString());
  console.log("totalCollateral", totalCollateral.toString());
  console.log("totalTokens", totalTokens.toString());
  console.log("collateralToTokensRatio", collateralToTokensRatio.toString());

  // get ETH/BTC price and figure out how over-collateralized the EMP is
  const ethbtcPrice = await getEthBtcPrice(wallet);
  const gcr = collateralToTokensRatio / ethbtcPrice;

  console.log("\nCalculate GCR");
  console.log("-------------");
  console.log("ethbtcPrice (ETH/BTC)", ethbtcPrice);
  console.log("Currently collateralized at", gcr);

  // determine how much to put in to maintain GCR
  const minSponsorTokens = fromWei(await emp.minSponsorTokens());
  const minCollateral = collateralToTokensRatio * minSponsorTokens;

  console.log("\nMinimum Amounts");
  console.log("---------------");
  console.log("minSponsorTokens", minSponsorTokens);
  console.log("minCollateral", minCollateral);

  const tokenAddress = await emp.tokenCurrency();
  const token = new ethers.Contract(tokenAddress, erc20.abi, wallet);

  const before = await token.balanceOf(wallet.address);

  // mint the tokens
  console.log("\nMinting tokens...");
  const collateralToUse = toWei(minCollateral).add(toWei("1"));
  await emp.create([collateralToUse], [toWei(minSponsorTokens)], {
    gasLimit: 6721975,
  });

  const after = await token.balanceOf(wallet.address);

  console.log("\nResult");
  console.log("------");
  console.log("tokens before", fromWei(before));
  console.log("tokens after", fromWei(after));
};

main();
