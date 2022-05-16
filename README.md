# 1Inch API Swap

## About

-Script to perform an ERC20 token swap utilizing the 1Inch Api 
-Configured for https://localhost:7545 Ethereum Mainnet Fork (via Ganache)
-Uses Ethers.jS

## Tech Stack

- Node
- [Ethers](https://web3js.readthedocs.io/en/v1.5.2/) (Blockchain Interaction)
- [Truffle](https://www.trufflesuite.com/docs/truffle/overview) (Development Framework)
- [Ganache-cli](https://github.com/trufflesuite/ganache) (For Local Blockchain)
- [Alchemy](https://www.alchemy.com/) (For forking the Ethereum mainnet)

## Requirements For Initial Setup
- Install [NodeJS](https://nodejs.org/en/), I recommend using node version 16.5.0 to avoid any potential dependency issues
- Install [Truffle](https://www.trufflesuite.com/docs/truffle/overview), In your terminal, you can check to see if you have truffle by running `truffle --version`. To install truffle run `npm i -g truffle`.
- Install [Ganache-cli](https://github.com/trufflesuite/ganache). To see if you have ganache-cli installed, in your command line type `ganache-cli --version`. To install, in your command line type `npm install ganache-cli --global`

## Setting Up
### 1. Clone/Download the Repository

### 2. Install Dependencies:
`$ npm install`

### 3. Start Ganache CLI
You will need to fork the Ethereum Mainnet onto your local machine. 
The command below will do just this, while unlocking the account address which you provide. 
- Please note, whichever address you choose to unlock, must be cooresponding to the UNLOCKED_ACCOUNT variable in 1inch_Swap.js 

In your terminal run:
```
ganache-cli -f wss://eth-mainnet.alchemyapi.io/v2/<Your-App-Key> -u <UNLOCKED_ACCOUNT_ADDRESS> -p 7545
```



### 4. Start the Script to See the Swap in Action
The script will run using UNLOCKED_ACCOUNT. Must match whichever account you chose to unlock when forking. 
```
$ truffle exec ./scripts/1inch_Swap.js`
```

