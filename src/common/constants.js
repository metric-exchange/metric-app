import EthIcon from "./tokens/eth.png";
import {BigNumber} from "@0x/utils";
import HypeIcon from "./tokens/hype.png";
import UpdownIcon from "./tokens/updown.jpg";
import GoldIcon from "./tokens/gold.png";

export let EthereumNetworkId = 1;

export let BinanceChainNetworkId = 56;

export let SupportedNetworks = [
    {
        id: EthereumNetworkId,
        name: "ethereum",
        config: {
            chainId: '0x1',
            chainName: 'Ethereum',
            nativeCurrency: {
                name: 'Ethereum',
                symbol: 'ETH',
                decimals: 18,
            },
            rpcUrls: ['https://mainnet.infura.io/v3/undefined'],
            blockExplorerUrls: ['https://etherscan.io'],
        },
        uris: {
            zeroX: "https://api.0x.org",
            tokens: "https://tokens.coingecko.com/uniswap/all.json"
        },
        defaultTokens: [
            {
                address: "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee".toLowerCase(),
                decimals: 18,
                symbol: "ETH",
                logoURI: EthIcon,
                balance: new BigNumber(NaN),
                allowance: {
                    ExchangeProxyAllowanceTarget : NaN,
                    Erc20Proxy : NaN,
                    ExchangeProxyV4Address: NaN
                },
                disabled: false,
                chainToken: true
            },
            {
                address:"0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2".toLowerCase(),
                symbol:"WETH",
                decimals:18,
                logoURI:"https://assets.coingecko.com/coins/images/2518/thumb/weth.png?1547036627",
                balance: new BigNumber(NaN),
                allowance: {
                    ExchangeProxyAllowanceTarget : NaN,
                    Erc20Proxy : NaN,
                    ExchangeProxyV4Address: NaN
                },
                disabled: false,
                wrappedChainToken: true
            },
            {
                address: "0x6e36556b3ee5aa28def2a8ec3dae30ec2b208739".toLowerCase(),
                decimals: 18,
                symbol: "BUILD",
                logoURI: "https://etherscan.io/token/images/build_32.png",
                balance: new BigNumber(NaN),
                allowance: {
                    ExchangeProxyAllowanceTarget : NaN,
                    Erc20Proxy : NaN,
                    ExchangeProxyV4Address: NaN
                },
                disabled: false
            },
            {
                address: "0xEfc1C73A3D8728Dc4Cf2A18ac5705FE93E5914AC".toLowerCase(),
                decimals: 18,
                symbol: "METRIC",
                logoURI: "https://etherscan.io/token/images/metric_32.png",
                balance: new BigNumber(NaN),
                allowance: {
                    ExchangeProxyAllowanceTarget : NaN,
                    Erc20Proxy : NaN,
                    ExchangeProxyV4Address: NaN
                },
                disabled: false
            },
            {
                address: "0x6B175474E89094C44Da98b954EedeAC495271d0F".toLowerCase(),
                decimals: 18,
                symbol: "DAI",
                logoURI: "https://etherscan.io/token/images/MCDDai_32.png",
                balance: new BigNumber(NaN),
                allowance: {
                    ExchangeProxyAllowanceTarget : NaN,
                    Erc20Proxy : NaN,
                    ExchangeProxyV4Address: NaN
                },
                disabled: false
            },
            {
                address: "0xe1212f852c0ca3491ca6b96081ac3cf40e989094".toLowerCase(),
                decimals: 18,
                symbol: "HYPE",
                logoURI: HypeIcon,
                balance: new BigNumber(NaN),
                allowance: {
                    ExchangeProxyAllowanceTarget : NaN,
                    Erc20Proxy : NaN,
                    ExchangeProxyV4Address: NaN
                },
                disabled: false
            },
            {
                address: "0xb7412e57767ec30a76a4461d408d78b36688409c".toLowerCase(),
                decimals: 18,
                symbol: "bCRED",
                balance: new BigNumber(NaN),
                allowance: {
                    ExchangeProxyAllowanceTarget : NaN,
                    Erc20Proxy : NaN
                },
                disabled: false
            },
            {
                address: "0xfbfaf8d8e5d82e87b80578fd348f60fb664e9390".toLowerCase(),
                decimals: 18,
                symbol: "UPDOWN",
                logoURI: UpdownIcon,
                balance: new BigNumber(NaN),
                allowance: {
                    ExchangeProxyAllowanceTarget : NaN,
                    Erc20Proxy : NaN,
                    ExchangeProxyV4Address: NaN
                },
                disabled: false
            },
            {
                address: "0xb34ab2f65c6e4f764ffe740ab83f982021faed6d".toLowerCase(),
                decimals: 18,
                symbol: "BSG",
                logoURI: GoldIcon,
                balance: new BigNumber(NaN),
                allowance: {
                    ExchangeProxyAllowanceTarget : NaN,
                    Erc20Proxy : NaN,
                    ExchangeProxyV4Address: NaN
                },
                disabled: false
            },
            {
                address: "0xa9d232cc381715ae791417b624d7c4509d2c28db".toLowerCase(),
                decimals: 18,
                symbol: "BSGS",
                balance: new BigNumber(NaN),
                allowance: {
                    ExchangeProxyAllowanceTarget : NaN,
                    Erc20Proxy : NaN,
                    ExchangeProxyV4Address: NaN
                },
                disabled: false
            },
            {
                address: "0x940c7ccd1456b29a6f209b641fb0edaa96a15c2d".toLowerCase(),
                decimals: 18,
                symbol: "BSGB",
                balance: new BigNumber(NaN),
                allowance: {
                    ExchangeProxyAllowanceTarget : NaN,
                    Erc20Proxy : NaN,
                    ExchangeProxyV4Address: NaN
                },
                disabled: false
            }

        ]
    },
    {
        id: BinanceChainNetworkId,
        name: "binance smart chain",
        config: {
            chainId: '0x38',
            chainName: 'Binance Smart Chain',
            nativeCurrency:
                {
                    name: 'BNB',
                    symbol: 'BNB',
                    decimals: 18
                },
            rpcUrls: ['https://bsc-dataseed.binance.org/'],
            blockExplorerUrls: ['https://bscscan.com/'],
        },
        uris: {
            zeroX: "https://bsc.api.0x.org",
            tokens: "https://raw.githubusercontent.com/pancakeswap/pancake-swap-interface/master/src/constants/token/pancakeswap.json"
        },
        defaultTokens: [
            {
                address: "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee".toLowerCase(),
                decimals: 18,
                symbol: "BNB",
                logoURI: "https://exchange.pancakeswap.finance/images/coins/0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c.png",
                balance: new BigNumber(NaN),
                allowance: {
                    ExchangeProxyAllowanceTarget : NaN,
                    Erc20Proxy : NaN,
                    ExchangeProxyV4Address: NaN
                },
                disabled: false,
                chainToken: true
            },
            {
                symbol: "WBNB",
                address: "0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c".toLowerCase(),
                decimals: 18,
                logoURI: "https://exchange.pancakeswap.finance/images/coins/0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c.png",
                balance: new BigNumber(NaN),
                allowance: {
                    ExchangeProxyAllowanceTarget : NaN,
                    Erc20Proxy : NaN,
                    ExchangeProxyV4Address: NaN
                },
                disabled: false,
                wrappedChainToken: true
            },
            {
                address: "0x6BA452968b79dEF7E1c5577559b951247BFd4245".toLowerCase(),
                decimals: 18,
                symbol: "bMETRIC",
                logoURI: "https://etherscan.io/token/images/metric_32.png",
                balance: new BigNumber(NaN),
                allowance: {
                    ExchangeProxyAllowanceTarget : NaN,
                    Erc20Proxy : NaN,
                    ExchangeProxyV4Address: NaN
                },
                disabled: false
            },
            {
                symbol: "bUSD",
                decimals: 18,
                address: "0xe9e7cea3dedca5984780bafc599bd69add087d56".toLowerCase(),
                logoURI: "https://exchange.pancakeswap.finance/images/coins/0xe9e7cea3dedca5984780bafc599bd69add087d56.png",
                balance: new BigNumber(NaN),
                allowance: {
                    ExchangeProxyAllowanceTarget : NaN,
                    Erc20Proxy : NaN,
                    ExchangeProxyV4Address: NaN
                },
                disabled: false
            }
        ]
    }
];
