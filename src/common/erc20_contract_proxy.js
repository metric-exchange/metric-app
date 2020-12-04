import {BigNumber} from "@0x/utils";
import {accountAddress} from "./wallet/wallet_manager";

let maxAllowance = new BigNumber(10 ** 28)

export const Erc20ContractProxy = {

    maxAllowance: maxAllowance,

    erc20Contract: function (address) {
        return contract(Erc20Abi, address)
    },

    getContract: function (abi, address) {
        return contract(abi, address)
    },

    approveTokenForTargetAddress: async function(tokenAddress, targetAddress, confirmationCallBack, errorCallback) {
        await contract(Erc20Abi, tokenAddress)
            .methods
            .approve(targetAddress, window.web3.utils.toBN(maxAllowance.toFixed()))
            .send({from: accountAddress()})
            .on('confirmation', async (confirmationNumber, receipt) => {
                if (confirmationNumber === 1) {
                    await confirmationCallBack()
                }
            })
            .on('error', errorCallback)
    },

    isAddressApprovedForToken: async function(address, tokenAddress, amount) {
        let allowance = await fetchTokenAllowance(accountAddress(), address, tokenAddress)
        return allowance > amount
    },
}

export async function fetchTokenAllowance(sourceAddress, targetAddress, tokenAddress) {
    let allowance = 0
    if (tokenAddress.toLowerCase() !== "0x0000000000000000000000000000000000000000") {
        allowance = await Erc20ContractProxy
            .erc20Contract(tokenAddress)
            .methods
            .allowance(sourceAddress, targetAddress)
            .call()
    }

    return isNaN(allowance) ? 0 : allowance
}

function contract(abi, address) {
    return new window.web3.eth.Contract(abi, address)
}

export let Erc20Abi = [ { "constant": true, "inputs": [], "name": "name", "outputs": [ { "name": "", "type": "string" } ], "payable": false, "stateMutability": "view", "type": "function" }, { "constant": false, "inputs": [ { "name": "spender", "type": "address" }, { "name": "value", "type": "uint256" } ], "name": "approve", "outputs": [ { "name": "", "type": "bool" } ], "payable": false, "stateMutability": "nonpayable", "type": "function" }, { "constant": false, "inputs": [ { "name": "_owner", "type": "address" } ], "name": "nominateNewOwner", "outputs": [], "payable": false, "stateMutability": "nonpayable", "type": "function" }, { "constant": true, "inputs": [], "name": "totalSupply", "outputs": [ { "name": "", "type": "uint256" } ], "payable": false, "stateMutability": "view", "type": "function" }, { "constant": false, "inputs": [ { "name": "from", "type": "address" }, { "name": "to", "type": "address" }, { "name": "value", "type": "uint256" } ], "name": "transferFrom", "outputs": [ { "name": "", "type": "bool" } ], "payable": false, "stateMutability": "nonpayable", "type": "function" }, { "constant": true, "inputs": [], "name": "decimals", "outputs": [ { "name": "", "type": "uint8" } ], "payable": false, "stateMutability": "view", "type": "function" }, { "constant": true, "inputs": [], "name": "nominatedOwner", "outputs": [ { "name": "", "type": "address" } ], "payable": false, "stateMutability": "view", "type": "function" }, { "constant": true, "inputs": [ { "name": "owner", "type": "address" } ], "name": "balanceOf", "outputs": [ { "name": "", "type": "uint256" } ], "payable": false, "stateMutability": "view", "type": "function" }, { "constant": false, "inputs": [ { "name": "_target", "type": "address" } ], "name": "setTarget", "outputs": [], "payable": false, "stateMutability": "nonpayable", "type": "function" }, { "constant": false, "inputs": [], "name": "acceptOwnership", "outputs": [], "payable": false, "stateMutability": "nonpayable", "type": "function" }, { "constant": true, "inputs": [], "name": "owner", "outputs": [ { "name": "", "type": "address" } ], "payable": false, "stateMutability": "view", "type": "function" }, { "constant": false, "inputs": [ { "name": "callData", "type": "bytes" }, { "name": "numTopics", "type": "uint256" }, { "name": "topic1", "type": "bytes32" }, { "name": "topic2", "type": "bytes32" }, { "name": "topic3", "type": "bytes32" }, { "name": "topic4", "type": "bytes32" } ], "name": "_emit", "outputs": [], "payable": false, "stateMutability": "nonpayable", "type": "function" }, { "constant": true, "inputs": [], "name": "useDELEGATECALL", "outputs": [ { "name": "", "type": "bool" } ], "payable": false, "stateMutability": "view", "type": "function" }, { "constant": true, "inputs": [], "name": "symbol", "outputs": [ { "name": "", "type": "string" } ], "payable": false, "stateMutability": "view", "type": "function" }, { "constant": false, "inputs": [ { "name": "to", "type": "address" }, { "name": "value", "type": "uint256" } ], "name": "transfer", "outputs": [ { "name": "", "type": "bool" } ], "payable": false, "stateMutability": "nonpayable", "type": "function" }, { "constant": false, "inputs": [ { "name": "value", "type": "bool" } ], "name": "setUseDELEGATECALL", "outputs": [], "payable": false, "stateMutability": "nonpayable", "type": "function" }, { "constant": true, "inputs": [], "name": "target", "outputs": [ { "name": "", "type": "address" } ], "payable": false, "stateMutability": "view", "type": "function" }, { "constant": true, "inputs": [ { "name": "owner", "type": "address" }, { "name": "spender", "type": "address" } ], "name": "allowance", "outputs": [ { "name": "", "type": "uint256" } ], "payable": false, "stateMutability": "view", "type": "function" }, { "inputs": [ { "name": "_owner", "type": "address" } ], "payable": false, "stateMutability": "nonpayable", "type": "constructor" }, { "payable": true, "stateMutability": "payable", "type": "fallback" }, { "anonymous": false, "inputs": [ { "indexed": true, "name": "from", "type": "address" }, { "indexed": true, "name": "to", "type": "address" }, { "indexed": false, "name": "value", "type": "uint256" } ], "name": "Transfer", "type": "event" }, { "anonymous": false, "inputs": [ { "indexed": true, "name": "owner", "type": "address" }, { "indexed": true, "name": "spender", "type": "address" }, { "indexed": false, "name": "value", "type": "uint256" } ], "name": "Approval", "type": "event" }, { "anonymous": false, "inputs": [ { "indexed": false, "name": "newTarget", "type": "address" } ], "name": "TargetUpdated", "type": "event" }, { "anonymous": false, "inputs": [ { "indexed": false, "name": "newOwner", "type": "address" } ], "name": "OwnerNominated", "type": "event" }, { "anonymous": false, "inputs": [ { "indexed": false, "name": "oldOwner", "type": "address" }, { "indexed": false, "name": "newOwner", "type": "address" } ], "name": "OwnerChanged", "type": "event" } ]

