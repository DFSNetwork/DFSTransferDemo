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
