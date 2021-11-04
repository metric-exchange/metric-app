import EthIcon from "./tokens/eth.png";
import {BigNumber} from "@0x/utils";

export let EthereumNetworkId = 1;

export let BinanceChainNetworkId = 56;
export let PolygonNetworkId = 137;
export let AvalancheNetworkId = 43114;
export let CeloNetworkId = 42220;
export let FantomNetworkId = 250;

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
            tokens: "https://raw.githubusercontent.com/build-finance/metric-token-lists/main/tokenLists/ethereum.json"
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
            metricShareVault: "0xAccbBaad2182FfA54996a480f70b2301cce7F5F7",
            metricShareVaultV0: "0x04d69Aec4eFdb5613120758d6c4cDB970f64a4E5",
            metric: "0xefc1c73a3d8728dc4cf2a18ac5705fe93e5914ac",
            metricLp: "0xa7d707118c02dcd2bea94ff05664db51363c47bd"
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
            tokens: "https://raw.githubusercontent.com/build-finance/metric-token-lists/main/tokenLists/bsc.json"
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
            tokens: "https://raw.githubusercontent.com/build-finance/metric-token-lists/main/tokenLists/polygon.json"
        },
        defaultTokens: [
            {
                address: "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
                decimals: 18,
                symbol: "MATIC",
                logoURI: "https://assets.coingecko.com/coins/images/4713/thumb/matic___polygon.jpg?1612939050",
                balance: new BigNumber(NaN),
                allowance: {
                    ExchangeProxyAllowanceTarget : NaN,
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
    },
    {
        id: AvalancheNetworkId,
        name: "Avalanche chain",
        config: {
            chainId: "0xA86A",
            chainName: "Avalanche Mainnet",
            nativeCurrency: {
                "name": "Avalanche",
                "symbol": "AVAX",
                "decimals": 18
            },
            rpcUrls: [
                "https://api.avax.network/ext/bc/C/rpc"
            ],
            blockExplorerUrls: [
                "https://explorer.avax.network",
                "https://cchain.explorer.avax.network"
            ]
        },
        uris: {
            zeroX: "https://avalanche.api.0x.org",
            tokens: "https://raw.githubusercontent.com/build-finance/metric-token-lists/main/tokenLists/avalanche.json"
        },
        defaultTokens: [
            {
                address: "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
                decimals: 18,
                symbol: "AVAX",
                logoURI: "https://raw.githubusercontent.com/ava-labs/bridge-tokens/main/avalanche-tokens/0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7/logo.png",
                balance: new BigNumber(NaN),
                allowance: {
                    ExchangeProxyAllowanceTarget : NaN,
                    ExchangeProxyV4Address: NaN
                },
                disabled: false,
                chainToken: true
            },
            {
                address: "0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7",
                decimals: 18,
                name: "Wrapped AVAX",
                symbol: "WAVAX",
                logoURI: "https://raw.githubusercontent.com/ava-labs/bridge-tokens/main/avalanche-tokens/0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7/logo.png",
                balance: new BigNumber(NaN),
                allowance: {
                    ExchangeProxyAllowanceTarget : NaN,
                    ExchangeProxyV4Address: NaN
                },
                disabled: false,
                wrappedChainToken: true
            },
            {
                address: "0xc7198437980c041c805A1EDcbA50c1Ce5db95118",
                decimals: 6,
                name: "Tether USD",
                symbol: "USDT.e",
                logoURI: "https://raw.githubusercontent.com/ava-labs/avalanche-bridge-resources/main/tokens/USDT/logo.png",
                balance: new BigNumber(NaN),
                allowance: {
                    ExchangeProxyAllowanceTarget : NaN,
                    ExchangeProxyV4Address: NaN
                },
                disabled: false
            },
        ]
    },
    {
        id: CeloNetworkId,
        name: "Celo chain",
        config: {
            chainId: "0xa4ec",
            chainName: "Celo Mainnet",
            nativeCurrency: {
                "name": "Celo",
                "symbol": "CELO",
                "decimals": 18
            },
            rpcUrls: [
                "https://forno.celo.org"
            ],
            blockExplorerUrls: [
                "https://explorer.celo.org"
            ]
        },
        uris: {
            zeroX: "https://celo.api.0x.org",
            tokens: "https://raw.githubusercontent.com/build-finance/metric-token-lists/main/tokenLists/celo.json"
        },
        defaultTokens: [
            {
                address: "0x471EcE3750Da237f93B8E339c536989b8978a438",
                decimals: 18,
                name: "Celo",
                symbol: "CELO",
                logoURI: "https://raw.githubusercontent.com/ubeswap/default-token-list/master/assets/asset_CELO.png",
                balance: new BigNumber(NaN),
                allowance: {
                    ExchangeProxyAllowanceTarget : NaN,
                    ExchangeProxyV4Address: NaN
                },
                disabled: false,
                chainToken: true,
                wrappedChainToken: true
            },
            {
                address: "0x765DE816845861e75A25fCA122bb6898B8B1282a",
                decimals: 18,
                name: "Celo Dollar",
                symbol: "cUSD",
                logoURI: "https://raw.githubusercontent.com/ubeswap/default-token-list/master/assets/asset_cUSD.png",
                balance: new BigNumber(NaN),
                allowance: {
                    ExchangeProxyAllowanceTarget : NaN,
                    ExchangeProxyV4Address: NaN
                },
                disabled: false
            },
        ]
    },
    {
        id: FantomNetworkId,
        name: "Fantom chain",
        config: {
            chainId: "0xfa",
            chainName: "Fantom Mainnet",
            nativeCurrency: {
                "name": "Fantom",
                "symbol": "FTM",
                "decimals": 18
            },
            rpcUrls: [
                "https://rpc.ftm.tools"
            ],
            blockExplorerUrls: [
                "https://ftmscan.com"
            ]
        },
        uris: {
            zeroX: "https://fantom.api.0x.org",
            tokens: "https://raw.githubusercontent.com/build-finance/metric-token-lists/main/tokenLists/fantom.json"
        },
        defaultTokens: [
            {
                address: "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
                decimals: 18,
                name: "Fantom",
                symbol: "FTM",
                logoURI: "https://assets.spookyswap.finance/tokens/FTM.png",
                balance: new BigNumber(NaN),
                allowance: {
                    ExchangeProxyAllowanceTarget : NaN,
                    ExchangeProxyV4Address: NaN
                },
                disabled: false,
                chainToken: true
            },
            {
                address: "0x049d68029688eabf473097a2fc38ef61633a3c7a",
                decimals: 6,
                name: "Fantom USDT",
                symbol: "fUSDT",
                logoURI: "https://assets.spookyswap.finance/tokens/fUSDT.png",
                balance: new BigNumber(NaN),
                allowance: {
                    ExchangeProxyAllowanceTarget : NaN,
                    ExchangeProxyV4Address: NaN
                },
                disabled: false
            },
            {
                symbol: "WFTM",
                address: "0x21be370d5312f44cb42ce377bc9b8a0cef1a4c83",
                decimals: 18,
                logoURI: "https://assets.spookyswap.finance/tokens/WFTM.png",
                balance: new BigNumber(NaN),
                allowance: {
                    ExchangeProxyAllowanceTarget : NaN,
                    ExchangeProxyV4Address: NaN
                },
                wrappedChainToken: true,
                disabled: false
            },
            {
                address: "0x44293e446d4fe519f177ee221055cb9e5dc4ac5b".toLowerCase(),
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
