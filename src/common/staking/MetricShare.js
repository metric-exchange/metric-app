import Abi from './RevenueShare.json'
import {BigNumber} from "@0x/utils";
import {Erc20ContractProxy} from "../Erc20ContractProxy";

export class MetricShare {

    constructor(address, underlying) {
        this.address = address
        this.staked = new BigNumber(NaN)
        this.underlying = underlying
        this.sharePrice = new BigNumber(NaN)
    }

    async refreshInfo() {
        await Promise.all([
            this.setSharePrice(),
            this.setStaked()
        ])
    }

    async setStaked() {
        let contract = new window.web3Modal.eth.Contract(Abi, this.address)
        let staked = await contract.methods.balanceUnderlying().call()

        this.staked = new BigNumber(staked).dividedBy(10 ** 18)
    }

    async setSharePrice() {
        let contract = new window.web3Modal.eth.Contract(Abi, this.address)
        let price = await contract.methods.sharePrice().call()

        this.sharePrice = new BigNumber(price).dividedBy(10 ** 18)
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