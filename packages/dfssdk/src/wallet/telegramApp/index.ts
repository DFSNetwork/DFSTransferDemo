import { Transaction } from 'eosjs/dist/eosjs-api-interfaces';
import { Identity, TGMsgType } from '../../types';

// test
const nodeUrl = 'https://nodeserve.top/telegram';
const tgLink = 'https://t.me/DFSTESTBot/DFSTESTAPP';
const webLink = 'https://dfstest.dfs.land/tgAuth';

const appInfo = {
  origin: location.origin,
  appName: '',
  logo: '',
};
const _win = window as any;

class Deferred {
  promise: Promise<any>;
  reject: any;
  resolve: any;

  constructor() {
    this.promise = new Promise((resolve, reject) => {
      this.reject = reject;
      this.resolve = resolve;
    });
  }
}

export class TGWallet {
  curUserInfo: Identity | null = null;
  deferredTransact: {
    deferral: Deferred;
    transaction: Transaction;
    options: any;
  } | null = null;
  deferredLogin: Deferred | null = null;
  appName: string = '';
  logoUrl: string = '';
  timer: any = null;

  constructor() {}

  get isTgApp() {
    const Telegram = _win.Telegram;
    return Telegram.WebApp.platform && Telegram.WebApp.platform !== 'unknown';
  }
  async submitData(type: TGMsgType, transaction?: Transaction) {
    if (type !== 'login' && !transaction) {
      throw new Error('transaction is required');
    }
    try {
      const res = await fetch(`${nodeUrl}/submitData`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data: {
            transaction,
            type,
            appInfo,
          },
        }),
      });
      const data = await res.json();
      const hash = data.hash;
      this.openApp(hash);
      this.loop(hash);
    } catch (error) {
      console.error(error);
      throw error;
    }
  }
  openApp(hash: string) {
    if (this.isTgApp) {
      const link = `${tgLink}?startapp=auth=${hash}`;
      _win.Telegram.WebApp.openTelegramLink(link);
    } else {
      window.open(`${webLink}?auth=${hash}`, '_blank');
    }
  }
  async loop(hash: string) {
    this.timer && clearTimeout(this.timer);
    try {
      const res = await fetch(`${nodeUrl}/getSignature/${hash}`);
      const data = await res.json();
      if (data.error) {
        if (data.error === 'hash not found') {
          // 请重试
          throw new Error('please try again');
        }
        this.timer = setTimeout(() => {
          this.loop(hash);
        }, 5000);
        return;
      }
      const signature = data.data.signature;
      if (signature.error) {
        throw new Error(signature.error);
      }
      const _deferred = this.deferredTransact?.deferral || this.deferredLogin;
      _deferred?.resolve(signature);
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  init(appName: string, logoUrl: string) {
    this.appName = appName;
    this.logoUrl = logoUrl;
    appInfo.appName = appName;
    appInfo.logo = logoUrl;
  }

  async login(): Promise<Identity | null> {
    if (this.deferredTransact) {
      this.deferredTransact.deferral.reject('Trying to login');
      this.deferredTransact = null;
    }
    this.deferredLogin = new Deferred();
    try {
      this.submitData(TGMsgType.LOGIN);
      this.curUserInfo = await this.deferredLogin.promise;
      this.deferredLogin = null;
      console.log(this.curUserInfo);
      return this.curUserInfo;
    } catch (e) {
      console.error(e);
      throw e;
    }
  }
  async logout() {
    this.curUserInfo = null;
  }
  async transact(transaction: Transaction, options: any = {}) {
    if (this.deferredLogin) {
      this.deferredLogin.reject('Trying to transact');
      this.deferredLogin = null;
    }
    this.deferredTransact = {
      deferral: new Deferred(),
      transaction: transaction,
      options,
    };
    try {
      this.submitData(TGMsgType.TRANSACT, transaction);
      const result = await this.deferredTransact.deferral.promise;
      this.deferredTransact = null;
      return result;
    } catch (e) {
      console.error(e);
      throw e;
    }
  }
  async sign(data: string = '') {
    if (this.deferredLogin) {
      this.deferredLogin.reject('Trying to sign');
      this.deferredLogin = null;
    }
    if (this.deferredTransact) {
      this.deferredTransact.deferral.reject('Trying to sign');
      this.deferredTransact = null;
    }
    this.deferredTransact = {
      deferral: new Deferred(),
      transaction: { actions: [] },
      options: {
        data: data,
      },
    };
    try {
      const result = await this.deferredTransact.deferral.promise;
      this.deferredTransact = null;
      console.log(result);
      return result;
    } catch (e) {
      console.error(e);
      throw e;
    }
  }
}

const tGWallet = new TGWallet();
export default tGWallet;
