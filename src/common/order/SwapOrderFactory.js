import {OrderFactory} from "./OrderFactory";
import {callSwapApi} from "../0x/0x_swap_proxy";
import {ExchangeProxyAllowanceTargetAddress} from "../tokens/token_fetch";
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
            ExchangeProxyAllowanceTargetAddress,
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

        let quote = await callSwapApi(order)

        quote.from = this.account

        await this.stateManager.setInProgressState(
            OrderState.SWAPPING,
            {
                sellAmount: formatNumber(quote.sellAmount / (10 ** this.order.sellToken.decimals)),
                sellToken: this.order.sellToken,
                buyAmount: formatNumber(quote.buyAmount / (10 ** this.order.buyToken.decimals)),
                buyToken: this.order.buyToken
            },
            true
        )

        await window.web3Modal.eth.sendTransaction(quote);

        Rollbar.debug("Swap succeeded")
    }

    buildOrderDetails(sellAmount, buyAmount) {
        let orderDetails = this.order.buildOrderDetails(sellAmount, buyAmount)

        let sellAmountWithFee = orderDetails.sellAmount.plus(orderDetails.sellFeeAmount)
        let buyAmountWithFee = orderDetails.buyAmount.plus(orderDetails.buyFeeAmount)

        let fee =
            orderDetails.buyFeeAmount
                .dividedBy(buyAmountWithFee)
                .toFixed(4, BigNumber.ROUND_UP)

        return {
            sellToken: this.order.sellToken.address,
            buyToken: this.order.buyToken.address,
            sellAmount: `${sellAmountWithFee}`,
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
