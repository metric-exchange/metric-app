import {OrderFactory} from "./OrderFactory";
import {callSwapApi} from "../0x/0x_swap_proxy";
import {ExchangeProxyV4Address, tokensList} from "../tokens/token_fetch";
import {OrderState} from "./OrderStateManager";
import {formatNumber} from "../helpers";
import {BigNumber} from "@0x/utils";
import {getSlippageConfig, setSlippageConfig} from "./SlippageConfig";
import Rollbar from "rollbar";

export class SwapOrderFactory extends OrderFactory {

    constructor(order, stateManager, accountAddress) {
        super(
            order,
            stateManager,
            ExchangeProxyV4Address,
            accountAddress
        );
        this.slippagePercentage = getSlippageConfig()
        this.order.sellPrice.calculated = false
    }

    setSlippage(slippage) {
        setSlippageConfig(slippage)
        this.slippagePercentage = slippage
    }

    async sendOrder(order) {

        let sellToken = tokensList().find(t => t.address.toLowerCase() === order.sellToken.toLowerCase())
        let buyToken = tokensList().find(t => t.address.toLowerCase() === order.buyToken.toLowerCase())

        let quote = await callSwapApi(order)

        quote.from = this.account

        await this.stateManager.setInProgressState(
            OrderState.SWAPPING,
            {
                sellAmount: formatNumber(quote.sellAmount / (10 ** sellToken.decimals)),
                sellToken: sellToken,
                buyAmount: formatNumber(quote.buyAmount / (10 ** buyToken.decimals)),
                buyToken: buyToken
            },
            true
        )

        await window.web3Modal.eth.sendTransaction(quote);

        if (sellToken.symbol === "ETH" && buyToken.symbol === "WETH") {
            Rollbar.info("Wrap succeeded")
        } else if (sellToken.symbol === "WETH" && buyToken.symbol === "ETH") {
            Rollbar.info("UnWrap succeeded")
        } else {
            Rollbar.info("Swap succeeded")
        }
    }

    buildOrderDetails(sellAmount, buyAmount) {
        let orderDetails = this.order.buildOrderDetails(sellAmount, buyAmount)

        let fee =
            orderDetails.buyFeeAmount
                .dividedBy(orderDetails.buyAmount)
                .toFixed(4, BigNumber.ROUND_UP)

        return {
            sellToken: this.order.sellToken.address,
            buyToken: this.order.buyToken.address,
            sellAmount: `${orderDetails.sellAmount}`,
            buyTokenPercentageFee: fee,
            feeRecipient : orderDetails.feeRecipient,
            affiliateAddress : orderDetails.feeRecipient,
            slippagePercentage: this.slippagePercentage,
            takerAddress: this.account,
            intentOnFilling: true,
            skipValidation: false
        }
    }

}
