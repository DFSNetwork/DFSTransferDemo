<template>
  <div class="wallets">
    <div class="title">Select Login Method</div>
    <div class="item" @click="handleChoose(WalletType.WEB)">
      <img src="@/assets/svg/fingerprint.svg" class="icon" />
      <div class="label">Passkey</div>
    </div>
    <div class="item" @click="handleChoose(WalletType.DFSWALLET)">
      <img src="@/assets/img/DFS.png" class="icon" />
      <div class="label">DFS Wallet</div>
    </div>
    <div
      class="item"
      v-if="isTgApp"
      @click="handleChoose(WalletType.TELEGRAMAPP)"
    >
      <img src="@/assets/img/DFS.png" class="icon" />
      <div class="label">Telegram App</div>
    </div>
  </div>
</template>

<script setup lang="ts">
// import { WalletType } from '@/utils/constant';
import { WalletType } from 'dfssdk/dist/types';

const isTgApp = computed(() => {
  const Telegram = (window as any).Telegram;
  return Telegram?.WebApp?.platform && Telegram?.WebApp?.platform !== 'unknown';
});

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
