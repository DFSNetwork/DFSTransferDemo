import { Identity, Market } from '@/types'
import { defineStore } from 'pinia'
import { ref } from 'vue'

const useAppStore = defineStore('app', () => {
  const _user = localStorage.getItem('user')
    ? JSON.parse(localStorage.getItem('user') as string) : null
  const user = ref<Identity | null>(_user)
  const setUser = (_user: Identity | null) => {
    user.value = _user
    if (_user) {
      localStorage.setItem('user', JSON.stringify(_user))
    } else {
      localStorage.removeItem('user')
    }
  }
  const markets = ref<Array<Market>>([])
  const setMarkets = (_markets: Array<Market>) => {
    markets.value = _markets
  }

  const rpcUrl = ref('https://api.dfs.land')
  return {
    user,
    setUser,
    markets,
    setMarkets,
    rpcUrl,
  }
})
export default useAppStore