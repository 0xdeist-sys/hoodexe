STONEFOLK MINT24 CONFIG

NFT contract: 0xdfb6c91d1e0df6195ea72514db5ea237b81c2686
Reward Vault: 0x924B9A7B2c0D93ea6110Ae12471FbF75e7F1323e
OpenSea: https://opensea.io/collection/stoneflok/overview
Mint start: Aug 9 2026 17:00 Turkey
Claim start: Aug 10 2026 17:00 Turkey

The site shows a live 24-hour claim countdown.
The final Reward Engine contract must also enforce the same claimStartTime on-chain.


VAULT BALANCE FIX:
The site now reads the Reward Vault balance from Robinhood Chain Blockscout first.
If that is unavailable it falls back to the official public Robinhood Chain RPC,
then to the connected wallet provider. This avoids relying on one rate-limited endpoint.


ESTIMATED REWARD:
- Connect Wallet reads real STONEFOLK balance.
- Reads live totalSupply() from the STONEFOLK contract.
- Reads live Reward Vault ETH balance.
- During the launch window, estimated reward = Vault Balance × wallet STONEFOLK / current minted supply.
- This is appropriate while all launch NFTs remain at base Holding Power 1.0.
- The deployed Reward Engine will later become the source of truth for time-based Power and final claims.


WALLET CONNECTION FIX:
- Requests wallet account permission first.
- Switches/adds Robinhood Chain only after the wallet is connected.
- Uses official mainnet settings: chain ID 4663 (0x1237), official public RPC, Blockscout explorer.
- Shows clearer MetaMask errors for cancelled/pending requests.
