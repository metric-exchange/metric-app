import {OrderFactory} from "./OrderFactory";
import {callSwapApi} from "../0x/0x_swap_proxy";
import {ExchangeProxyAllowanceTargetAddress} from "../tokens/token_fetch";
import {OrderState} from "./OrderStateManager";
import {formatNumber} from "../helpers";
import {BigNumber} from "@0x/utils";
import {DEFAULT_SWAP_SLIPPAGE} from "./constants";

export class SwapOrderFactory extends OrderFactory {

    constructor(order, stateManager, accountAddress) {
        super(
            order,
            stateManager,
            ExchangeProxyAllowanceTargetAddress,
            accountAddress
        );
        this.slippagePercentage = DEFAULT_SWAP_SLIPPAGE
    }

    async sendOrder() {

        let order = await this.buildOrderDetails()
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

        await window.web3.eth.sendTransaction(quote);
    }

    async buildOrderDetails() {
        let orderDetails = this.order.buildOrderDetails(this.order.sellAmount.value, this.order.buyAmount.value)

        let sellAmount =
            new BigNumber(orderDetails.sellAmount + orderDetails.sellFeeAmount).integerValue(BigNumber.ROUND_DOWN)

        let fee =
            new BigNumber(orderDetails.buyFeeAmount)
                .dividedBy(orderDetails.buyAmount + orderDetails.buyFeeAmount)
                .toFixed(4, BigNumber.ROUND_UP)

        return {
            sellToken: this.order.sellToken.address,
            buyToken: this.order.buyToken.address,
            sellAmount: `${sellAmount}`,
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
