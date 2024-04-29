import webSdk, { WebWallet } from "./webWallet";
import dfsWallet, { DfsWallet } from "./dfsWallet";
import { Transaction } from 'eosjs/dist/eosjs-api-interfaces';
import { Action } from 'eosjs/dist/eosjs-serialize';
import { Identity, WalletType } from "../types";

class Wallet {
  webSdk: WebWallet | DfsWallet | null = null;
  appName: string = '';
  logo: string = '';
  rpcUrl: string = '';

  constructor({
    appName = '',
    logo = '',
    rpcUrl = '',
  }: {
    appName: string;
    logo: string;
    rpcUrl: string;
  }) {
    this.appName = appName;
    this.logo = logo;
    this.rpcUrl = rpcUrl;
  }
  setAppInfo(appName: string, logo: string) {
    this.appName = appName;
    this.logo = logo;
  }
  async init(walletType: WalletType) {
    if (walletType === WalletType.WEB) {
      webSdk.init(this.appName, this.logo);
      this.webSdk = webSdk;
      return
    }
    this.webSdk = dfsWallet;
    await dfsWallet.init(this.appName, this.logo);
  }
  async login(): Promise<Identity | null> {
    if (!this.webSdk) {
      throw new Error('Wallet not init');
    }
    const userInfo = await this.webSdk.login();
    return userInfo;
  }
  async logout() {
    if (this.webSdk) {
      await this.webSdk?.logout();
    }
  }
  async transact(transaction: Transaction | Action[], options: any = {}) {
    if (!this.webSdk) {
      throw new Error('Wallet not init');
    }
    let _t: Transaction = Array.isArray(transaction) ? { actions: transaction } : transaction;
    return await this.webSdk.transact(_t, options);
  }
  async sign(data: string = '') {
    if (!this.webSdk) {
      throw new Error('Wallet not init');
    }
    return await this.webSdk.sign(data);
  }
}

export default Wallet;