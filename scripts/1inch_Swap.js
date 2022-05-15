// var Web3 = require('web3');
const ethers = require('ethers');
const BigNumber = require('bignumber.js');
const fetch = require('node-fetch');
const { URLSearchParams } = require('url');

const provider = new ethers.providers.JsonRpcProvider("http://127.0.0.1:7545");
const UNLOCKED_ACCOUNT = '0xcA436e14855323927d6e6264470DeD36455fC8bD';
const signer = provider.getSigner(UNLOCKED_ACCOUNT);
const IERC20 = require('@openzeppelin/contracts/build/contracts/ERC20.json')
// DAI Token
const erc20ABI = require('../abis/erc20.json');
const { decryptKeystoreSync } = require('@ethersproject/json-wallets');
const prompt = require('prompt-sync')();


const oneSplitDexes = [
    "Uniswap",
    "Kyber",
    "Bancor",
    "Oasis",
    "Curve Compound",
    "Curve uni",
    "Curve Y",
    "Curve Binance",
    "Curve Synthetix",
    "Uniswap Compound",
    "Uniswap CHAI",
    "Uniswap Aave",
    "Mooniswap",
    "Uniswap V2",
    "Uniswap V2 ETH",
    "Uniswap V2 DAI",
    "Uniswap V2 USDC",
    "Curve Pax",
    "Curve renBTC",
    "Curve tBTC",
    "Dforce XSwap",
    "Shell",
    "mStable mUSD"
];

module.exports = async function (callback) {
    const signerArray = await provider.listAccounts();
    const axios = require('axios')

    var tokensArray = null;
    const tokensList = await axios.post('http://tokens.1inch.eth.link').then(result => {
        tokensArray = result.data.tokens;
    })
    const srcToken = tokensArray.filter(obj => {
        return obj.symbol === 'USDT'
    })
    const destToken = tokensArray.filter(obj => {
        return obj.symbol === 'DAI'
    })
    var destTokenContract = null;
    var srcTokenContract = null;

    if (!destToken[0]) {
        console.log('Error! DestToken not found in tokensList...Manual destToken injection neccessary.')
        ////
        // const injectedAddress = 'ERC20_CONTRACT_ADDRESS_HERE'
        // destTokenContract = new ethers.Contract(injectedAddress, IERC20.abi, signer)
        ////
        callback();
        // const manualTokenAddress = prompt("ERC20 Token's Address?:");
        // destTokenContract = new ethers.Contract(manualTokenAddress, IERC20.abi, signer);
        // console.log(`Hey there ${name}`);
    }
    if(destToken.length!=0){
        destTokenContract = new ethers.Contract(destToken[0].address, IERC20.abi, signer)
    }

    srcTokenContract = new ethers.Contract(srcToken[0].address, IERC20.abi, signer)

    const apiBaseUrl = 'https://api.1inch.io/v4.0/' + 1;
    const oneinchAllowanceAddress = '0x1111111254fb6c44bac0bed2854e76f90643097d';
    const amountToSwap = '100000';
    let amountWithDecimals = new BigNumber(amountToSwap).shiftedBy(srcToken[0].decimals).toFixed()
    const swapParams = {
        fromTokenAddress: srcToken[0].address, // 1INCH
        toTokenAddress: destToken[0].address, // DAI
        amount: amountWithDecimals,
        fromAddress: UNLOCKED_ACCOUNT,
        slippage: 25,
        disableEstimate: true,
    }
    function apiRequestUrl(methodName, queryParams) {
        return apiBaseUrl + methodName + '?' + (new URLSearchParams(queryParams)).toString();
    }

    async function buildTxForSwap(_swapParams) {
        const url = apiRequestUrl('/swap', _swapParams);
        const data = await axios.get(url)
        return data;
    }
    async function quoteForSwap(_swapParams) {
        const quoteParams = {
            fromTokenAddress: _swapParams.fromTokenAddress,
            toTokenAddress: _swapParams.toTokenAddress,
            amount: _swapParams.amount,
        }
        const url = apiRequestUrl('/quote', _swapParams);
        const quoteData = await axios.get(url)
        return quoteData.data
    }

    async function approveToken(_spender, _amt) {
        const tx = await srcTokenContract.approve(_spender, _amt).then(result => {
            console.log('Approval Granted! Tx Hash: ', result.hash);
        })
        const quoteBuild = await quoteForSwap(swapParams)
        console.log('Destination Token Amount: ', (parseInt(quoteBuild.toTokenAmount) / (10 ** destToken[0].decimals)))
        const apiBuild = await buildTxForSwap(swapParams)
        const txsend = await swap1Inch(apiBuild.data.tx)
    }
    async function getFromTokenAllowance(_owner, _spender) {
        var readyToBuild = false;
        const tx = await srcTokenContract.allowance(_owner, _spender).then(result => {
            console.log('Running 1Inch_Swap.js.....')
            console.log('----------------------------------------')
            console.log('Source Token Allowance :', ethers.utils.formatUnits(result, srcToken[0].decimals))
            const parsedAllowance = ethers.utils.formatUnits(result, srcToken[0].decimals);
            if (parsedAllowance < parseFloat(amountToSwap)) {
                const allowanceDiff = parseFloat(amountToSwap) - parsedAllowance;
                // console.log('Allowance Diff : - ' + allowanceDiff)
                console.log('Approval needed. Calling approval...');
                approveToken(oneinchAllowanceAddress, ethers.utils.parseUnits(String(allowanceDiff), srcToken[0].decimals));
            }
            else {
                readyToBuild = true;
                console.log('Approval amount sufficent. Attempting swap...')
            }
        })
        if (readyToBuild) {
            const quoteBuild = await quoteForSwap(swapParams)
            console.log('Destination Token Amount: ', (parseInt(quoteBuild.toTokenAmount) / (10 ** destToken[0].decimals)))
            const apiBuild = await buildTxForSwap(swapParams)
            console.log(apiBuild.data.tx)
            const tx = apiBuild.data.tx;
            await swap1Inch(tx);
            callback()
        }
    }

    async function swap1Inch(_txData) {
        _txData.gas = 1000000
        const tx = await signer.sendTransaction({
            to: _txData.to,
            data: _txData.data,
            value: ethers.utils.parseEther(String(_txData.value))
        })
        await tx.wait()
        console.log('------------------------------------')
        console.log('Swap Tx Successful! Hash: ', tx.hash)
        console.log('----------------------------------------')
        await getBalances();
    }

    async function getBalances() {
        const balSrc = await srcTokenContract.balanceOf(UNLOCKED_ACCOUNT)
        console.log(srcToken[0].name, 'Balance After: ', (parseInt(balSrc) / (10 ** srcToken[0].decimals)))
        const balDest = await destTokenContract.balanceOf(UNLOCKED_ACCOUNT)
        console.log(destToken[0].name, 'Balance After: ', (parseInt(balDest) / (10 ** destToken[0].decimals)))
        callback()
    }

    async function start() {
        await getFromTokenAllowance(UNLOCKED_ACCOUNT, oneinchAllowanceAddress)
    }

    await start();


}