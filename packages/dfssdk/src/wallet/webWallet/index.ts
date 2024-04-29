
import { Transaction } from "eosjs/dist/eosjs-api-interfaces";
import { Identity } from "../../types";

class Deferred {
  promise: Promise<any>
  reject: any
  resolve: any

  constructor() {
    this.promise = new Promise((resolve, reject) => {
      this.reject = reject
      this.resolve = resolve
    })
  }
}

const OPEN_SETTINGS = 'menubar=1,resizable=1,width=400,height=800';
let _childWindow: Window | null = null;
let linkUrl = 'https://dfs.land';
// linkUrl = 'https://localhost:5173';

export class WebWallet {
  curUserInfo: Identity | null = null;
  deferredTransact: {
    deferral: Deferred
    transaction: Transaction
    options: any
  } | null = null;
  deferredLogin: Deferred | null = null;
  appName: string = '';
  logoUrl: string = '';

  constructor() {
    setInterval(() => this.closeWindow(), 500);
    window.addEventListener('message', (event: MessageEvent) => {
      this.dealMsg(event);
    }, false);
  }
  public get childWindow() {
    return _childWindow;
  }
  public set childWindow(value: Window | null) {
    _childWindow = value;
  }

  init(appName: string, logoUrl: string) {
    this.appName = appName;
    this.logoUrl = logoUrl;
  }
  dealMsg(event: MessageEvent) {
    const data = event.data;
    if (data.channel !== 'DFS') {
      return;
    }
    try {
      const msgData = JSON.parse(data.data);
      switch (data.type) {
        case 'login':
          this.dealLoginMsg(msgData);
          break;
        case 'transact':
          this.dealTransferMsg(msgData);
          break;
        case 'sign':
          this.dealSignMsg(msgData);
      }
    } catch (error) {
      console.log(error);
    }
  }
  dealLoginMsg(msgData: any) {
    const { status, message } = msgData;
    if (status === 'error') {
      this.deferredLogin!.reject(message);
      this.deferredLogin = null;
      this.closeWindow(true);
      return;
    }
    if (status === 'ready') {
      this.sendMsg({
        type: 'login',
        data: {
          appName: this.appName,
          logo: this.logoUrl,
        },
      })
      return
    }
    if (status === 'success') {
      this.deferredLogin?.resolve(msgData.data);
      // this.closeWindow(true);
    }
  }

  async login(): Promise<Identity | null> {
    if (this.deferredTransact) {
      this.closeWindow(true)
      this.deferredTransact.deferral.reject('Trying to login')
      this.deferredTransact = null
    }
    this.childWindow = this.openWindow(`${linkUrl}/dappAuth`);
    this.deferredLogin = new Deferred();
    try {
      this.curUserInfo = await this.deferredLogin.promise
      this.deferredLogin = null;
      console.log(this.curUserInfo)
      this.closeWindow(true);
      return this.curUserInfo
    } catch (e) {
      console.error(e)
      throw e
    }
  }
  async logout() {
    this.curUserInfo = null;
  }

  dealTransferMsg(msgData: any) {
    const { status, message } = msgData;
    if (status === 'error') {
      this.deferredTransact!.deferral.reject(message);
      this.deferredTransact = null;
      this.closeWindow(true);
      return;
    }
    if (status === 'ready') {
      this.sendMsg({
        type: 'transact',
        data: {
          appName: this.appName,
          logo: this.logoUrl,
          transaction: this.deferredTransact!.transaction,
          options: this.deferredTransact!.options
        },
      })
      return
    }
    if (status === 'success') {
      this.deferredTransact?.deferral.resolve(msgData.data);
    }
  }
  async transact(transaction: Transaction, options: any = {}) {
    if (this.deferredLogin) {
      this.closeWindow(true)
      this.deferredLogin.reject('Trying to transact')
      this.deferredLogin = null
    }
    this.childWindow = this.openWindow(`${linkUrl}/dappAuth/transact`);
    this.deferredTransact = {
      deferral: new Deferred(),
      transaction: transaction,
      options
    };
    try {
      const result = await this.deferredTransact.deferral.promise
      this.deferredTransact = null;
      this.closeWindow(true);
      return result
    } catch (e) {
      console.error(e)
      throw e
    }
  }

  dealSignMsg(msgData: any) {
    const { status, message } = msgData;
    if (status === 'error') {
      this.deferredTransact!.deferral.reject(message);
      this.deferredTransact = null;
      this.closeWindow(true);
      return;
    }
    if (status === 'ready') {
      this.sendMsg({
        type: 'sign',
        data: {
          data: this.deferredTransact!.options.data
        },
      })
      return
    }
    if (status === 'success') {
      this.deferredTransact?.deferral.resolve(msgData.data);
    }
  }

  async sign(data: string = '') {
    if (this.deferredLogin) {
      this.closeWindow(true)
      this.deferredLogin.reject('Trying to sign')
      this.deferredLogin = null
    }
    if (this.deferredTransact) {
      this.closeWindow(true)
      this.deferredTransact.deferral.reject('Trying to sign')
      this.deferredTransact = null
    }
    this.childWindow = this.openWindow(`${linkUrl}/dappAuth/sign`);
    this.deferredTransact = {
      deferral: new Deferred(),
      transaction: { actions: [] },
      options: {
        data: data
      }
    };
    try {
      const result = await this.deferredTransact.deferral.promise
      this.deferredTransact = null;
      console.log(result)
      this.closeWindow(true);
      return result
    } catch (e) {
      console.error(e)
      throw e
    }
  }

  sendMsg({
    type = 'login',
    data,
  }: {
    type: string;
    data?: Object;
  }) {
    if (!this.childWindow) {
      return;
    }
    this.childWindow!.postMessage(
      {
        channel: 'DFS',
        type,
        data: data ? JSON.stringify(data) : '',
      },
      '*'
    );
  }

  closeWindow(force = false) {
    if (this.childWindow) {
      if (force) {
        this.childWindow.close();
      }

      if (force || this.childWindow.closed) {
        console.log('force = ', force, 'this.childWindow.closed = ', this.childWindow?.closed);
        this.childWindow = null;

        if (this.deferredLogin) {
          this.deferredLogin.reject('Close')
          this.deferredLogin = null
        }
        if (this.deferredTransact) {
          this.deferredTransact.deferral.reject('Close')
          this.deferredTransact = null

        }
      }
    }
  }
  openWindow(url: string) {
    if (this.childWindow) {
      this.childWindow.close();
      this.childWindow = null;
    }
    return window.open(url, '_blank', OPEN_SETTINGS);
  }
}
const webWallet = new WebWallet()
export default webWallet