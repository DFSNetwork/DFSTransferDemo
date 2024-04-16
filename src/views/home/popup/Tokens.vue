<template>
  <div class="tokens">
    <div class="title">Select Token</div>
    <div class="lists">
      <div
        class="list"
        v-for="item in allTokens"
        :key="item.symbol"
        @click="handleChoose(item)"
      >
        <img :src="handleGetCoinImg(item)" class="coin" />
        <span>{{ item.symbol }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import useAppStore from '@/store/modules/app';
import { Token } from '@/types';
import { getAllTokens, getCoinImg } from '@/utils/common';

const emit = defineEmits(['close', 'change']);
const appStore = useAppStore();
const markets = computed(() => appStore.markets);
const allTokens = computed(() => {
  return getAllTokens(markets.value);
});
const handleGetCoinImg = (token: Token) => {
  return getCoinImg({
    symbol: token.symbol,
    contract: token.contract,
  });
};
const handleChoose = (token: Token) => {
  emit('change', token);
};
</script>

<style scoped lang="scss">
.tokens {
  padding: 10px;
  border-radius: 10px;
  color: #fff;
  .title {
    text-align: center;
    font-size: 18px;
    font-weight: 600;
    margin-bottom: 10px;
  }
  .lists {
    font-size: 16px;
    .list {
      height: 50px;
      @include flexs;
      padding-left: 35%;
      cursor: pointer;
      border-radius: 4px;
      border-bottom: 1px solid #161616;
      &:hover {
        background: #333;
      }
      &:last-child {
        border: 0;
      }
    }
    .coin {
      width: 35px;
      height: 35px;
      border-radius: 50%;
      display: block;
      margin-right: 6px;
    }
  }
}
</style>
