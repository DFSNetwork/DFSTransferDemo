<template>
  <div class="dfs-navs">
    <div class="dfs-logo">
      <img
        src="https://dfs.land/assets/icons/180x180.png"
        class="dfs-logo__img"
      />
      <div class="dfs-logoName">
        <div class="dfs-logoName__dfs">DFS</div>
        <div class="dfs-logoName__net">Network</div>
      </div>
    </div>
    <div>
      <van-button v-if="!userInfo" @click="showWallets = true"
        >Login</van-button
      >
      <div v-else class="dfs-info">
        {{ userInfo.name }}
        <van-button
          type="warning"
          @click="handleLogout"
          class="logout"
          size="small"
          >Logout</van-button
        >
      </div>
    </div>

    <van-popup class="popup" v-model:show="showWallets" round :closeable="true">
      <WalletList @listenChoose="handleChoose" />
    </van-popup>
  </div>
</template>

<script setup lang="ts">
import WalletList from './WalletList.vue';
import useAppStore from '@/store/modules/app';
import { Identity } from '@/types';
import { WalletType } from '@/utils/constant';
import DFSWallet from '@/wallet';

const appStore = useAppStore();
const userInfo = computed<Identity | null>(() => appStore.user);

const showWallets = ref(false);
const handleChoose = (walletType: WalletType) => {
  showWallets.value = false;
  handleLogin(walletType);
};
const handleLogin = async (walletType: WalletType) => {
  try {
    localStorage.setItem('walletType', walletType);
    await DFSWallet.init(walletType);
    const userInfo = await DFSWallet.login();
    appStore.setUser(userInfo);
  } catch (error) {
    console.error(error);
  }
};
const handleLogout = () => {
  DFSWallet.logout();
  appStore.setUser(null);
};
</script>

<style scoped lang="scss">
@include b(navs) {
  @include flexb;
  @include b(logo) {
    @include flexs;
    @include e(img) {
      width: 50px;
      height: 50px;
      display: block;
      margin-right: 5px;
    }
    @include b(logoName) {
      text-align: left;
      @include e(dfs) {
        color: #fff;
        font-weight: bold;
        font-size: 18px;
      }
      @include e(net) {
        color: #ccc;
        font-size: 14px;
      }
    }
  }
}
@include b(info) {
  @include flexc;
  color: #fff;
  .logout {
    margin-left: 10px;
  }
}
.popup {
  background: #000;
  box-shadow: 0 0 2px 1px #333;
}
</style>
