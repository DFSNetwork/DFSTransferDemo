# DFS Wallet Demo

This dapp demonstrates how a dapp can log in through the dfs plug-in wallet or passkey, and how to interact with the dfs blockchain.
该 dapp 演示了一个 dapp 如何通过 dfs 插件钱包或 passkey 的方式登录，以及如何与 dfs 区块链进行交互。

## Installation

### npm

```
npm i dfssdk
```

### yarn

```
yarn add dfssdk
```

## Usage

```
import Wallet from "dfssdk";

const DFSWallet = new Wallet({
  appName: 'DFS Tansfer Demo',
  logo: 'https://dfs.land/assets/icons/180x180.png',
  rpcUrl: 'https://api.dfs.land'
});

const login = async (walletType: WalletType) => {
  await DFSWallet.init(walletType);
  userInfo.value = await DFSWallet.login();
};

const logout = async () => {
  DFSWallet.logout();
  // ...
  userInfo.value = null
}

const transact = async () => {
  const transaction: Transaction = {
    actions: [
      {
        account: 'eosio.token',
        name: 'transfer',
        authorization: [
          {
            actor: userInfo.value?.name || '',
            permission: userInfo.value?.authority || 'active',
          },
        ],
        data: {
          from: userInfo.value?.name,
          to: 'testusera114',
          quantity: '0.00000001 DFS',
          memo: 'test dfssdk transfer',
        },
      },
    ],
  };

  try {
    const userinfo = await DFSWallet.transact(transaction, {
      useFreeCpu: true,
    });
    showSuccessToast('transfer success!');
  } catch (error) {
    showFailToast(
      error instanceof Error ? error.message : JSON.stringify(error)
    );
  }
}

```
