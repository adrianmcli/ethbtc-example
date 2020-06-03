require("dotenv").config();
const Ganache = require("ganache-core");
const { ethers } = require("ethers");

const port = 8545;
const nodeUrl = process.env.MAINNET_NODE_URL;
const privKey = process.env.PRIV_KEY;

const server = Ganache.server({
  fork: nodeUrl,
  network_id: 1,
  gasLimit: 20000000,
  accounts: [
    {
      secretKey: privKey,
      balance: ethers.utils.hexlify(ethers.utils.parseEther("1000")),
    },
  ],
});

server.listen(port, () => {
  console.log("listening on port", port);
});
