import EthIcon from "./tokens/eth.png";
import {BigNumber} from "@0x/utils";
import HypeIcon from "./tokens/hype.png";
import UpdownIcon from "./tokens/updown.jpg";
import GoldIcon from "./tokens/gold.png";

export let EthereumNetworkId = 1;

export let BinanceChainNetworkId = 56;
export let PolygonNetworkId = 137;

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
                    ExchangeProxyV4Address: NaN
                },
                disabled: false,
                chainToken: true,
                hasHidingGame: false
            },
            {
                address:"0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2".toLowerCase(),
                symbol:"WETH",
                decimals:18,
                logoURI:"https://assets.coingecko.com/coins/images/2518/thumb/weth.png?1547036627",
                balance: new BigNumber(NaN),
                allowance: {
                    ExchangeProxyV4Address: NaN
                },
                disabled: false,
                wrappedChainToken: true,
                hasHidingGame: false
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
                disabled: false,
                hasHidingGame: false
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
                disabled: false,
                hasHidingGame: false
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
                disabled: false,
                hasHidingGame: false
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
                    ExchangeProxyV4Address: NaN
                },
                disabled: false,
                chainToken: true,
                hasHidingGame: false
            },
            {
                symbol: "WBNB",
                address: "0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c".toLowerCase(),
                decimals: 18,
                logoURI: "https://exchange.pancakeswap.finance/images/coins/0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c.png",
                balance: new BigNumber(NaN),
                allowance: {
                    ExchangeProxyV4Address: NaN
                },
                disabled: false,
                wrappedChainToken: true,
                hasHidingGame: false
            },
            {
                address: "0x6BA452968b79dEF7E1c5577559b951247BFd4245".toLowerCase(),
                decimals: 18,
                symbol: "bMETRIC",
                logoURI: "https://etherscan.io/token/images/metric_32.png",
                balance: new BigNumber(NaN),
                allowance: {
                    ExchangeProxyV4Address: NaN
                },
                disabled: false,
                hasHidingGame: false
            }
        ]
    },
    {
        id: PolygonNetworkId,
        name: "polygon chain",
        config: {
            chainId: '0x89',
            chainName: 'Polygon Mainnet',
            nativeCurrency:
                {
                    name: 'MATIC',
                    symbol: 'MATIC',
                    decimals: 18
                },
            rpcUrls: [
                "https://rpc-mainnet.matic.network",
                "wss://ws-mainnet.matic.network"
            ]
        },
        uris: {
            zeroX: "https://polygon.api.0x.org",
            tokens: "https://unpkg.com/quickswap-default-token-list@1.0.48/build/quickswap-default.tokenlist.json"
        },
        defaultTokens: [
            {
                address: "0x0000000000000000000000000000000000001010".toLowerCase(),
                decimals: 18,
                symbol: "MATIC",
                logoURI: "https://assets.coingecko.com/coins/images/4713/thumb/matic___polygon.jpg?1612939050",
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
                address: "0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270",
                decimals: 18,
                symbol: "WMATIC",
                logoURI: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x7D1AfA7B718fb893dB30A3aBc0Cfc608AaCfeBB0/logo.png",
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
                address: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174",
                decimals: 6,
                symbol: "USDC",
                logoURI: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48/logo.png",
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
