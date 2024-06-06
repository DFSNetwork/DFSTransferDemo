import Wallet from 'dfssdk';
// import Wallet from '../../packages/dfssdk/src/index';

const DFSWallet = new Wallet({
  appName: 'DFS Tansfer Demo',
  logo: 'https://dfs.land/assets/icons/180x180.png',
  rpcUrl: 'https://api.dfs.land',
});

export default DFSWallet;
