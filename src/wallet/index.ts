
import useAppStore from '@/store/modules/app';
import { WalletType } from '@/utils/constant';
import webSdk, { WebSdk } from '@/wallet/webSdk';
import dfsWallet, { DfsWallet } from './dfsSdk';

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
  transact(actions: Array<any>, options: any = {}) {
    if (!this.webSdk) {
      throw new Error('Wallet not init');
    }
    return this.webSdk.transact(actions, options);
  }
}

const DFSWallet = new Wallet();
export default DFSWallet