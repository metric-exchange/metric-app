import Abi from './RevenueShare.json'
import {BigNumber} from "@0x/utils";
import {Erc20ContractProxy} from "../Erc20ContractProxy";
import {accountAddress} from "../wallet/WalletManager";

export class MetricShare {

    constructor(address) {
        this.address = address
    }

    async sharePrice() {
        let contract = new window.web3Modal.eth.Contract(Abi, this.address)
        let price = await contract.methods.sharePrice().call()

        return new BigNumber(price).dividedBy(10 ** 18)
    }

    async underlying() {
        let contract = new window.web3Modal.eth.Contract(Abi, this.address)
        return await contract.methods.underlying().call()
    }

    async enter(accountAddress, amount) {
        let contract = new window.web3Modal.eth.Contract(Abi, this.address)
        let underlying = await contract.methods.underlying().call()

        let token = Erc20ContractProxy.erc20Contract(underlying)
        let normalizedAmount = amount.multipliedBy(10 ** 18)
        let allowance = await token.methods.allowance(accountAddress, this.address).call()
        if (new BigNumber(allowance).isLessThan(normalizedAmount)) {
            await token.methods.approve(this.address, new BigNumber(10 ** 24).toString()).send({from: accountAddress})
        }
        await contract.methods.enter(normalizedAmount.toString(10)).send({from: accountAddress})
    }

    async leave(accountAddress, amount) {
        let xToken = Erc20ContractProxy.erc20Contract(this.address)
        let normalizedAmount = amount.multipliedBy(10 ** 18)
        let allowance = await xToken.methods.allowance(accountAddress, this.address).call()
        if (new BigNumber(allowance).isLessThan(normalizedAmount)) {
            await xToken.methods.approve(this.address, new BigNumber(10 ** 24).toString()).send({from: accountAddress})
        }
        let contract = new window.web3Modal.eth.Contract(Abi, this.address)
        await contract.methods.leave(normalizedAmount.toString(10)).send({from: accountAddress})
    }

    async shares(accountAddress) {
        let contract = new window.web3Modal.eth.Contract(Abi, this.address)
        let balance = await contract.methods.balanceOf(accountAddress).call()

        return new BigNumber(balance).dividedBy(10 ** 18)
    }

}