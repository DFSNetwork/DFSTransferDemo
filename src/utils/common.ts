import { Market } from "@/types";

const apiUrl = 'https://api.dfs.land'

export const getTableRows = async (params: any) => {
  const resp = await fetch(`${apiUrl}/v1/chain/get_table_rows`, {
    method: 'POST',
    body: JSON.stringify(params)
  })
  const res = await resp.json();
  return res
}
export const getCurrencBalance = async ({
  contract,
  symbol,
  account
}: {
  contract: string,
  symbol: string,
  account: string
}) => {
  const params = {
    account,
    code: contract,
    symbol
  }
  const resp = await fetch(`${apiUrl}/v1/chain/get_currency_balance`, {
    method: 'POST',
    body: JSON.stringify(params)
  })
  const balance = await resp.json();
  return balance;
}
export const getAccount = async (account: string) => {
  const params = {
    account_name: account
  }
  const resp = await fetch(`${apiUrl}/v1/chain/get_account`, {
    method: 'POST',
    body: JSON.stringify(params)
  })
  const info = await resp.json();
  return info;
}

// get All tokens from markets
export function getAllTokens(mkts: Array<Market>) {
  const arr = new Set();
  const marketLists = [...mkts];
  marketLists.forEach((mkt) => {
    const sym0 = mkt.sym0.split(',')
    const token0 = {
      contract: mkt.contract0,
      symbol: sym0[1],
      decimal: sym0[0],
    };
    arr.add(JSON.stringify(token0));
    const sym1 = mkt.sym1.split(',')
    const token1 = {
      contract: mkt.contract1,
      symbol: sym1[1],
      decimal: sym1[0],
    };
    arr.add(JSON.stringify(token1));
  });
  const allTokens = [...arr].map((v) => JSON.parse(v as string));
  return allTokens;
}

// get token coinImg 
export function getCoinImg({ contract, symbol }: { contract: string, symbol: string }) {
  return `https://dfstest.dfs.land/assets/tokens/${contract}-${symbol}.png?v=3`
}