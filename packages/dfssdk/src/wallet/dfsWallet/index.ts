import { Api, JsonRpc } from 'eosjs';
import {
  SignatureProviderArgs,
  Transaction,
} from 'eosjs/dist/eosjs-api-interfaces';
import { JsSignatureProvider } from 'eosjs/dist/eosjs-jssig';
import { Identity } from '../../types';
import { PushTransactionArgs } from 'eosjs/dist/eosjs-rpc-interfaces';

const CHAINID =
  '000d9cae502dd1cc895745e204f83cc892bc4c450f92a03ecd4fe057709853cc';
const RPCURL = 'https://api.dfs.land';
const FREECPU = {
  privateKey: '5JdBkvZva99uwBanXjGGhF4T7SrLpgTBipU76CD9QN4dFRPuD4N',
  account: 'dfs.service',
  authority: 'cpu',
  contract: 'dfsfreecpu11',
  actionName: 'freecpu',
};
function getFreeCpuApi(rpcUrl: string, freeCpuPrivateKey: string) {
  const httpEndpoint = rpcUrl;
  const private_keys = [freeCpuPrivateKey];
  // dfs.service
  const signatureProvider = new JsSignatureProvider(private_keys);
  const rpc = new JsonRpc(httpEndpoint, { fetch });
  const eos_client = new Api({
    rpc,
    signatureProvider,
    textDecoder: new TextDecoder(),
    textEncoder: new TextEncoder(),
  });
  return eos_client;
}

const win = window as any;
let provider: any = win.dfswallet || null;
const dfsLoaded = () => {
  if (provider != null) {
    return;
  }
  provider = win.dfswallet;
  if (!dfsWallet.api) {
    dfsWallet.init(dfsWallet.appName, dfsWallet.logoUrl, dfsWallet.rpcUrl);
  }
};
document.addEventListener('dfsWalletLoaded', dfsLoaded);
export class DfsWallet {
  times: number = 30;
  appName: string = '';
  logoUrl: string = '';
  DFSWallet: any = null;
  api: Api | null = null;
  chainId = CHAINID;
  rpcUrl = RPCURL;
  freeCpuApi: Api | null = null;

  constructor() {
    this.connect().then((res) => {
      console.log('connect - res', res);
    });
  }

  async connect(): Promise<boolean> {
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

  async init(appName: string, logoUrl: string, rpcUrl: string = RPCURL) {
    this.appName = appName;
    this.logoUrl = logoUrl;
    this.rpcUrl = rpcUrl;
    const network = { chainId: this.chainId };
    const rpc = new JsonRpc(this.rpcUrl, { fetch });
    await this.regIsConnect();
    this.api = this.DFSWallet?.dfs(network, Api, { rpc });
    this.freeCpuApi = getFreeCpuApi(this.rpcUrl, FREECPU.privateKey);
  }
  async login(): Promise<Identity> {
    await this.regIsConnect();
    let id = await this.DFSWallet.login({
      chainId: this.chainId,
      newLogin: true,
    });
    if (!id) {
      throw new Error('user rejects');
    }
    return {
      channel: 'dfswallet',
      authority: id.accounts[0].authority,
      name: id.accounts[0].name,
      publicKey: id.accounts[0].publicKey,
    };
  }
  async logout() {}
  async transact(transaction: Transaction, opts: any = {}) {
    if (opts.useFreeCpu) {
      delete opts.useFreeCpu;
      return await this.transactByFreeCpu(transaction, opts);
    }

    try {
      let resp = await this.api?.transact(
        transaction,
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
  async transactByFreeCpu(transaction: Transaction, opts: any = {}) {
    const accAuth = transaction.actions[0].authorization[0];
    transaction.actions.unshift({
      account: FREECPU.contract,
      name: FREECPU.actionName,
      authorization: [
        {
          actor: FREECPU.account,
          permission: FREECPU.authority,
        },
        accAuth,
      ],
      data: {
        user: accAuth.actor,
      },
    });
    try {
      // 当前账户签名
      let _PushTransactionArgs = (await this.api?.transact(transaction, {
        blocksBehind: 3,
        expireSeconds: 3600,
        ...opts,
        sign: false,
        broadcast: false,
      })) as PushTransactionArgs;
      const availableKeys =
        await this.api?.signatureProvider.getAvailableKeys();
      const serializedTx = _PushTransactionArgs?.serializedTransaction;
      const signArgs = {
        chainId: this.chainId,
        requiredKeys: availableKeys,
        serializedTransaction: serializedTx,
        abis: [],
      } as SignatureProviderArgs;
      let pushTransactionArgs = await this.api?.signatureProvider.sign(
        signArgs
      );

      // 免CPU签名
      const freeCpuRequiredKeys =
        await this.freeCpuApi?.signatureProvider.getAvailableKeys();
      const signArgsFreeCpu = {
        chainId: this.chainId,
        requiredKeys: freeCpuRequiredKeys,
        serializedTransaction: serializedTx,
        abis: [],
      };
      let pushTransactionArgsFreeCpu =
        await this.freeCpuApi?.signatureProvider.sign(
          signArgsFreeCpu as SignatureProviderArgs
        );
      pushTransactionArgs?.signatures.unshift(
        pushTransactionArgsFreeCpu?.signatures[0] as string
      );
      // 将操作广播出去
      let push_result = await this.api?.pushSignedTransaction(
        pushTransactionArgs as PushTransactionArgs
      );
      return push_result;
    } catch (error) {
      const eMsg = this.dealError(error);
      throw eMsg;
    }
  }

  async sign(data: string = '') {
    if (!this.DFSWallet || !this.api) {
      throw new Error('Wallet not init');
    }
    const availableKeys =
      (await this.api?.signatureProvider.getAvailableKeys()) as string[];
    return await this.DFSWallet.getArbitrarySignature(availableKeys[0], data);
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
