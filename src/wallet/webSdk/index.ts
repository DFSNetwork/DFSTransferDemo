import { Identity } from "@/types";

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
let linkUrl = 'https://dfstest.dfs.land';
linkUrl = 'https://localhost:5173';

export class WebSdk {
  curUserInfo: Identity | null = null;
  deferredTransact: {
    deferral: Deferred
    actions: Array<any>
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

  async login() {
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
  logout() {
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
          actions: this.deferredTransact!.actions,
          options: this.deferredTransact!.options
        },
      })
      return
    }
    if (status === 'success') {
      this.deferredTransact?.deferral.resolve(msgData.data);
    }
  }
  async transact(actions: Array<any>, options: any = {}) {
    if (this.deferredLogin) {
      this.closeWindow(true)
      this.deferredLogin.reject('Trying to transact')
      this.deferredLogin = null
    }
    this.childWindow = this.openWindow(`${linkUrl}/dappAuth/transact`);
    this.deferredTransact = {
      deferral: new Deferred(),
      actions,
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
const webSdk = new WebSdk()
export default webSdk