require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

module.exports = {
  solidity: {
    version: "0.8.19",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    development: {
      url: "http://127.0.0.1:8545",
      accounts: [
        "0x4f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7d21715b23b1d"
      ],
      chainId: 1337,
      gas: 6721975,
      gasPrice: 20000000000
    },
    ganache: {
      url: "http://127.0.0.1:7545",
      accounts: [
        "0x4f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7d21715b23b1d",
        "0x6cbed15c793ce57650b9877cf6fa156fbef513c4e6134f022a85b1ffdd59b2a1",
        "0x6370fd033278c143682da5a5d1a5f336e6f53c23a2f4e6b8ebf24f29b57a5f72"
      ],
      chainId: 1337,
      gas: 6721975,
      gasPrice: 20000000000
    }
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  }
};