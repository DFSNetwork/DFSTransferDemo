import { Transaction } from 'eosjs/dist/eosjs-api-interfaces';

export enum WalletType {
  WEB = 'webSdk',
  DFSWALLET = 'dfsWallet',
  TELEGRAMAPP = 'telegramApp',
}
export interface Identity {
  channel: string;
  publicKey: string;
  name: string;
  authority: string;
}

export interface Market {
  contract0: string;
  contract1: string;
  sym0: string;
  sym1: string;
  liquidity_token: string;
  mid: number;
  reserve0: string;
  reserve1: string;
}
export interface Token {
  contract: string;
  symbol: string;
  decimal: number;
}
export interface AppMsg {
  type: string;
  data?: Object;
}
export interface AppInfo {
  appName: string;
  logoUrl: string;
  origin: string;
}

export enum TGMsgType {
  LOGIN = 'login',
  TRANSACT = 'transact',
  // SIGN = 'sign',
}
export interface TgMsg {
  type: TGMsgType;
  appInfo: AppInfo;
  transaction?: Transaction;
}
