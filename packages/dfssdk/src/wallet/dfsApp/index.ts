import { AppMsg } from '../../types';

const strippedHost = () => {
  let host = location.hostname;
  // Replacing www. only if the domain starts with it.
  if (host.indexOf('www.') === 0) host = host.replace('www.', '');
  return host;
};

let msgId = 0;
const msgMap = new Map();
const watchBackgroundMessages = () => {
  window.addEventListener('message', (event) => {
    const message = event.data;
    if (message.target !== 'DFSApp') {
      return;
    }
    if (message.type === 'loaded') {
      const dapp = new Dapp();
      (window as any).dfswallet = dapp;
      document.dispatchEvent(new CustomEvent('dfsWalletLoaded'));
      window.parent.postMessage(
        {
          target: 'DApp',
          type: 'dfsWalletLoaded',
        },
        '*'
      );
      return;
    }
    const data = event.data;
    const callback = msgMap.get(data.id);
    msgMap.delete(data.id);
    callback && callback(data.data);
  });
};

const sendMessageToBackground = (msg: AppMsg) => {
  return new Promise((resolve) => {
    const _msgId = ++msgId;
    msgMap.set(_msgId, resolve);
    window.parent.postMessage(
      {
        target: 'DApp',
        type: msg.type,
        data: msg.data,
        id: _msgId,
      },
      '*'
    );
  });
};
const MsgType = {
  GETIDENTITYFROMPERMISSIONS: 'getIdentityFromPermissions',
  GETVARSION: 'getVersion',
  GETIDENTITY: 'getIdentity',
  FORGETIDENTITY: 'forgetIdentity',
  REQUESTAVAILABLEKEYS: 'requestAvailableKeys',
  REQUESTRAWABI: 'requestRawAbi',
  REQUESTREQUIREDKEYS: 'requestRequiredKeys',
  REQUESTCHAININFO: 'requestChainInfo',
  IMPORTCREATEDACCOUNT: 'importCreatedAccount',
  REQUESTARBITRARYSIGNATURE: 'requestArbitrarySignature',
  REQUESTSIGNATURE: 'requestSignature',
};

class Dapp {
  _identity = null;
  chainId = '';
  constructor() {
    this.init();
  }
  get identity() {
    return this._identity;
  }
  set identity(_id) {}
  async getVersion() {
    const resMsg: any = await this.signal(MsgType.GETVARSION);
    const version = resMsg.data;
    return version;
  }
  async init() {
    try {
      const resMsg: any = await this.signal(MsgType.GETIDENTITYFROMPERMISSIONS);
      if (!resMsg.status) {
        throw new Error('no dfswallet');
      }
      this._identity = resMsg.data;
    } catch (e) {}
    document.dispatchEvent(new CustomEvent('dfsWalletLoaded'));
  }
  async login(payload: any) {
    return await this.getIdentity(payload);
  }
  async getIdentity(params: any) {
    const resMsg: any = await this.signal(MsgType.GETIDENTITY, params);
    this._identity = resMsg.data;
    return this._identity;
  }
  async logout(account: string) {
    return await this.forgetIdentity(account);
  }
  async forgetIdentity(account: string) {
    const resMsg: any = await this.signal(MsgType.FORGETIDENTITY, { account });
    this._identity = resMsg.data;
    return this.identity;
  }

  signatureProvider(chainId: string, dapp: Dapp) {
    return {
      async getAvailableKeys() {
        const resMsg: any = await dapp.signal(MsgType.REQUESTAVAILABLEKEYS, {
          chainId,
        });
        const keys = resMsg.data;
        return keys;
      },

      async sign(signatureArgs: any) {
        const params = {
          chainId: signatureArgs.chainId,
          requiredKeys: [],
          serializedTransaction: [],
          serializedContextFreeData: [],
          abis: [],
        };
        //Uint8Array to array
        params.serializedTransaction = Array.from(
          signatureArgs.serializedTransaction
        );
        if (signatureArgs.serializedContextFreeData) {
          params.serializedContextFreeData = Array.from(
            signatureArgs.serializedContextFreeData
          );
        }
        const resMsg: any = await dapp.signal(MsgType.REQUESTSIGNATURE, params);
        if (!resMsg.status) {
          throw new Error(resMsg.error);
        }
        const result = resMsg.data;

        return {
          signatures: result.signatures,
          serializedTransaction: signatureArgs.serializedTransaction,
        };
      },
    };
  }
  async requestRawAbi(account: string, chainId: string) {
    const params = { account, chainId };
    const result: any = await this.signal(MsgType.REQUESTRAWABI, params);
    return result.data;
  }
  async requestRequiredKeys(transaction: any, availableKeys: any) {
    const params = { transaction, availableKeys };
    const result: any = await this.signal(MsgType.REQUESTREQUIREDKEYS, params);
    return result.data;
  }

  dfs(network: any, Api: any, options: any) {
    const chainId = options.chainId ? options.chainId : network.chainId;
    this.chainId = chainId;
    options.chainId = chainId;
    options.signatureProvider = this.signatureProvider(chainId, this);
    options.authorityProvider = {
      getRequiredKeys: async ({ transaction, availableKeys }: any) => {
        return await this.requestRequiredKeys(transaction, availableKeys);
      },
    };
    const api = new Api(options);

    function reverseHex(h: string) {
      return (
        h.substring(6, 8) +
        h.substring(4, 6) +
        h.substring(2, 4) +
        h.substring(0, 2)
      );
    }

    const timePointSecToDate = (ms: number) => {
      const s = new Date(ms).toISOString();
      return s.substring(0, s.length - 5);
    };

    const generateTapos = async (transaction: any, expireSeconds: any) => {
      if (typeof expireSeconds !== 'number') {
        expireSeconds = 30;
      }
      const resMsg: any = await this.signal(MsgType.REQUESTCHAININFO, {
        chainId,
      });
      const { info } = resMsg.data;

      const ref_block_num = info.head_block_num;
      const ref_block_prefix = parseInt(
        reverseHex(info.head_block_id.substr(16, 8)),
        16
      );
      return {
        expiration: timePointSecToDate(Date.now() + expireSeconds * 1000),
        ref_block_num: ref_block_num & 0xffff,
        ref_block_prefix: ref_block_prefix,
        ...transaction,
      };
    };
    api.oTransact = api.transact;

    api.transact = async (transaction: any, options: any) => {
      // fill options
      if (typeof options != 'object') {
        options = {};
      }

      const {
        blocksBehind,
        useLastIrreversible,
        expireSeconds,
        ref_block_num,
        ref_block_prefix,
      } = options;
      if (
        typeof blocksBehind == 'undefined' &&
        typeof useLastIrreversible == 'undefined' &&
        (!ref_block_num || !ref_block_prefix)
      ) {
        transaction = await generateTapos(transaction, expireSeconds);
      }
      // add authorityProvider
      options.authorityProvider = {
        getRequiredKeys: async ({ transaction, availableKeys }: any) => {
          return await this.requestRequiredKeys(transaction, availableKeys);
        },
      };
      const smoothMode = false;

      if (
        !smoothMode ||
        (typeof options.broadcast != 'undefined' && options.broadcast == false)
      ) {
        return await api.oTransact(transaction, options);
      }
    };
    return api;
  }

  async signal(type: string, data?: any) {
    const message: any = {
      type,
    };
    const payload = {
      domain: strippedHost(),
      chainId: this.chainId,
    };
    message.data = payload;
    if (typeof data != 'undefined') {
      if (data.chainId) {
        this.chainId = data.chainId;
      } else if (this.chainId) {
        data.chainId = this.chainId;
      }
      message.data = Object.assign(payload, data);
    }
    return sendMessageToBackground(message);
  }

  async importCreatedAccount(info: any) {
    const params = {
      info,
    };
    const result = await this.signal(MsgType.IMPORTCREATEDACCOUNT, params);
    return result;
  }
  async getArbitrarySignature(publicKey: string, data: any) {
    const params = { publicKey, data };
    const resMsg: any = await this.signal(
      MsgType.REQUESTARBITRARYSIGNATURE,
      params
    );
    if (!resMsg.status) {
      throw new Error(resMsg.error);
    }
    const result = resMsg.data;
    return result.signatures[0];
  }
}

watchBackgroundMessages();
