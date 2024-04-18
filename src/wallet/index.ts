
import useAppStore from '@/store/modules/app';
import { WalletType } from '@/utils/constant';
import webSdk, { WebSdk } from '@/wallet/webSdk';
import dfsWallet, { DfsWallet } from './dfsSdk';
import { Transaction } from 'eosjs/dist/eosjs-api-interfaces';
import { Action } from 'eosjs/dist/eosjs-serialize';

class Wallet {
  webSdk: WebSdk | DfsWallet | null = null;
  appName: string = '';
  logo: string = '';
  setAppInfo(appName: string, logo: string) {
    this.appName = appName;
    this.logo = logo;
  }
  async init(walletType: WalletType) {
    localStorage.setItem('walletType', walletType);
    if (walletType === WalletType.WEB) {
      webSdk.init(this.appName, this.logo);
      this.webSdk = webSdk;
      return
    }
    this.webSdk = dfsWallet;
    await dfsWallet.init(this.appName, this.logo);
  }

  async login() {
    if (!this.webSdk) {
      throw new Error('Wallet not init');
    }
    const userInfo = await this.webSdk.login();
    const appStore = useAppStore();
    appStore.setUser(userInfo);
    return userInfo;
  }
  logout() {
    if (this.webSdk) {
      this.webSdk?.logout();
    }
    const appStore = useAppStore();
    appStore.setUser(null);
  }
  transact(transaction: Transaction | Action[], options: any = {}) {
    if (!this.webSdk) {
      throw new Error('Wallet not init');
    }
    let _t: Transaction = Array.isArray(transaction) ? { actions: transaction } : transaction;
    return this.webSdk.transact(_t, options);
  }
}

const DFSWallet = new Wallet();
export default DFSWallet