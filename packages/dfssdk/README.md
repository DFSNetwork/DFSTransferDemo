# DFS SDK

is one of the packages that gives developers the ability to create web applications to interact with DFS Network. This SDK will facilitate the process of communication between the web application and the DFS Network. This package allows to send requests to the wallet for user authentication and signatures.​

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

```js
import Wallet from 'dfssdk';

const DFSWallet = new Wallet({
  appName: 'DFS Tansfer Demo',
  logo: 'https://dfs.land/assets/icons/180x180.png',
  rpcUrl: 'https://api.dfs.land',
});

const login = async (walletType: WalletType) => {
  await DFSWallet.init(walletType);
  userInfo.value = await DFSWallet.login();
};

const logout = async () => {
  DFSWallet.logout();
  // ...
  userInfo.value = null;
};

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
};

const handleSign = async (signText: string) => {
  try {
    const res = await DFSWallet.sign(signText);
    console.log(res);
  } catch (error) {
    console.log(error);
  }
};
```
