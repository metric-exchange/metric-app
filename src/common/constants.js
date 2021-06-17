import EthIcon from "./tokens/eth.png";
import {BigNumber} from "@0x/utils";

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
                address: "0xefc1c73a3d8728dc4cf2a18ac5705fe93e5914ac".toLowerCase(),
                decimals: 18,
                symbol: "METRIC",
                logoURI: "https://etherscan.io/token/images/metric_32.png",
                balance: new BigNumber(NaN),
                allowance: {
                    ExchangeProxyV4Address: NaN
                },
                disabled: false,
                hasHidingGame: false
            }
        ],
        staking: {
            metricShare: "0xdBd974ec753054e78Aa8Eb959761e3d22C632490",
            metricShareVault: "0xb86142472D87b8d3187F4D7cA449032ad1F38E2a"
        }
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
                address: "0x29dfd3d644b18e0345eed3a3c94b4efe35f2771b".toLowerCase(),
                decimals: 18,
                symbol: "METRIC",
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
                address: "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee".toLowerCase(),
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
                address: "0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270",
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
                address: "0x9f1Aeb72d5F38f2852b2a0f610bFb0391a6a9aB4".toLowerCase(),
                decimals: 18,
                symbol: "METRIC",
                logoURI: "https://etherscan.io/token/images/metric_32.png",
                balance: new BigNumber(NaN),
                allowance: {
                    ExchangeProxyV4Address: NaN
                },
                disabled: false,
                hasHidingGame: false
            }
        ]
    }
];
