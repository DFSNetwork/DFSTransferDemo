import useAppStore from "@/store/modules/app";
import { Api, JsonRpc } from "eosjs";


const win = (window as any);
let provider: any = win.dfswallet || null;
const dfsLoaded = () => {
  if (provider != null) {
    return;
  }
  provider = win.dfswallet;
};
document.addEventListener('dfsWalletLoaded', dfsLoaded);
export class DfsWallet {
  times: number = 30;
  appName: string = '';
  logoUrl: string = '';
  DFSWallet: any = null;
  api: Api | null = null;
  chainId = '000d9cae502dd1cc895745e204f83cc892bc4c450f92a03ecd4fe057709853cc';

  constructor() {
    this.connect().then((res) => {
      console.log('connect - res', res);
    });
  }

  async connect() {
    return new Promise((resolve) => {
      if (provider != null) {
        this.DFSWallet = provider;
        resolve(true);
      } else {
        let times = 0;
        let timer = setInterval(() => {
          if (provider != null || ++times == this.times) {
            this.DFSWallet = provider;
            clearInterval(timer);
            resolve(provider != null);
          }
        }, 50);
      }
    });
  }
  async regIsConnect() {
    const isConnected = await this.connect();
    if (!isConnected) {
      throw new Error('dfsWallet not connected');
    }
  }

  async init(appName: string, logoUrl: string) {
    this.appName = appName;
    this.logoUrl = logoUrl;
    const appStore = useAppStore();
    const network = { chainId: this.chainId };
    const rpc = new JsonRpc(appStore.rpcUrl, { fetch });
    await this.regIsConnect();
    this.api = this.DFSWallet?.dfs(network, Api, { rpc });
  }
  async login() {
    await this.regIsConnect();
    let id = await this.DFSWallet.login({
      chainId: this.chainId,
      newLogin: true
    });
    if (!id) {
      throw new Error('user rejects');
    }
    return {
      channel: 'dfswallet',
      authority: id.accounts[0].authority,
      name: id.accounts[0].name,
      publicKey: id.accounts[0].publicKey
    };
  }
  async logout() { }
  async transact(actions: Array<any>, opts: any = {}) {
    try {
      let resp = await this.api?.transact(
        { actions },
        Object.assign(
          {
            blocksBehind: 3,
            expireSeconds: 3600,
          },
          opts
        )
      );
      return resp;
    } catch (error) {
      const eMsg = this.dealError(error);
      throw eMsg;
    }
  }

  dealError(e: any) {
    let back = {
      code: 999,
      message: e.toString(),
    };
    if (e.message === 'you have no permission for this operation') {
      back = {
        code: 999,
        message: e.message,
      };
      return back;
    }

    if (e.code === 0) {
      back = {
        code: 0,
        message: 'Cancel',
      };
      return back;
    }
    if (e.json && e.json.code === 500) {
      const dErr = e.json.error;
      const dealFun = [
        [
          (code: any) => {
            const codes = [3080004];
            return codes.includes(Number(code));
          },
          (tErr: any) => {
            const detail = tErr.details;
            if (
              detail[0].message.indexOf(
                'reached node configured max-transaction-time'
              ) !== -1
            ) {
              return {
                code: '3080004_2',
                message: 'reached node configured max-transaction-time',
              };
            }
            return {
              code: 402,
              message: 'CPU Insufficient',
            };
          },
        ],
        [
          (code: any) => {
            const codes = [3080002, 3080001];
            return codes.includes(Number(code));
          },
          (tErr: any) => {
            return {
              code: 402,
              message: `${tErr.code == 3080001 ? 'RAM' : 'CPU'} Insufficient`,
            };
          },
        ],
        [
          (code: any) => {
            const codes = [3080006];
            return codes.includes(Number(code));
          },
          () => {
            return {
              code: 3080006,
              message: 'timeout',
            };
          },
        ],
        [
          (code: any) => {
            const codes = [3050003, 3010010];
            return codes.includes(Number(code));
          },
          (tErr: any) => {
            const detail = tErr.details;
            if (
              detail[0].message.indexOf('INSUFFICIENT_OUTPUT_AMOUNT') !== -1
            ) {
              return {
                code: 3050003,
                message: 'INSUFFICIENT OUTPUT AMOUNT',
              };
            }
            return {
              code: tErr.code,
              message: detail[0].message,
            };
          },
        ],
      ];

      const findErr = dealFun.find((v) => v[0](dErr.code));
      if (findErr) {
        back = findErr[1](dErr) as any;
      } else {
        back = {
          code: dErr.code,
          message: dErr.details[0].message,
        };
      }
      return {
        code: back.code,
        message: back.message,
      };
    }
    return back;
  }
}

const dfsWallet = new DfsWallet();
export default dfsWallet;