<template>
  <div class="wallets">
    <div class="title">Connect Wallet</div>
    <div class="item" @click="handleChoose(WalletType.WEB)">
      <img src="https://dfs.land/assets/icons/180x180.png" class="icon" />
      <div class="label">DFS Web Wallet</div>
    </div>
    <div class="item" @click="handleChoose(WalletType.DFSWALLET)">
      <img src="https://dfs.land/assets/icons/180x180.png" class="icon" />
      <div class="label">Chrome DFS Wallet</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { WalletType } from '@/utils/constant';

const emit = defineEmits(['listenChoose']);
const handleChoose = (walletType: WalletType) => {
  emit('listenChoose', walletType);
};
</script>

<style scoped lang="scss">
.wallets {
  padding: 10px;
  border-radius: 12px;
  background: #000;
  width: 300px;
  color: #fff;
  .title {
    font-size: 22px;
    font-weight: bold;
    margin-bottom: 10px;
  }
  .item {
    @include flexc;
    cursor: pointer;
    height: 60px;
    border-bottom: 1px solid #333;
    border-radius: 5px;
    &:last-child {
      border: none;
    }
    &:hover {
      background: #333;
    }
    .icon {
      width: 40px;
      height: 40px;
      margin-right: 8px;
      display: block;
    }
  }
}
</style>
