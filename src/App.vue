<template>
  <router-view></router-view>
</template>

<script setup lang="ts">
import useAppStore from './store/modules/app';
import DFSWallet from '@/wallet';
import { WalletType } from 'dfssdk/dist/types';

const appStore = useAppStore();
const user = computed(() => appStore.user);

// set App info
DFSWallet.setAppInfo(
  'DFS Tansfer Demo',
  'https://dfs.land/assets/icons/180x180.png'
);

watch(
  user,
  () => {
    if (user.value?.name) {
      const walletType = (localStorage.getItem('walletType') ||
        WalletType.WEB) as WalletType;
      DFSWallet.init(walletType);
    }
  },
  {
    immediate: true,
  }
);
</script>

<style scoped>
.logo {
  height: 6em;
  padding: 1.5em;
  will-change: filter;
  transition: filter 300ms;
}
.logo:hover {
  filter: drop-shadow(0 0 2em #646cffaa);
}
.logo.vue:hover {
  filter: drop-shadow(0 0 2em #42b883aa);
}
</style>
