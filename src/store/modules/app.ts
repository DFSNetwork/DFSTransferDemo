import { Identity } from '@/types'
import { defineStore } from 'pinia'
import { ref } from 'vue'

const useAppStore = defineStore('app', () => {
  const user = ref<Identity | null>(null)
  const setUser = (_user: Identity | null) => {
    user.value = _user
  }

  const rpcUrl = ref('https://api.dfs.land')
  return {
    user,
    setUser,
    rpcUrl
  }
})
export default useAppStore