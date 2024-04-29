<template>
  <div class="sign">
    <div class="title">Sign Text</div>
    <div class="item">
      <div class="label">Sign Text</div>
      <div class="iptDiv">
        <van-field
          class="ipt"
          type="text"
          v-model="signText"
          placeholder="Please enter the sign text"
          autocomplete="off"
        />
      </div>
    </div>
    <div class="signRes" v-if="signRes">
      <div class="title">Sign Result</div>
      <div class="res">{{ signRes }}</div>
    </div>

    <van-button
      type="primary"
      class="btn"
      @click="handleSign()"
      :loading="loading"
      >Sign</van-button
    >
  </div>
</template>

<script setup lang="ts">
import useAppStore from '@/store/modules/app';
import { Identity } from '@/types';
import DFSWallet from '@/wallet';
import { showFailToast } from 'vant';

const appStore = useAppStore();
const userInfo = computed<Identity | null>(() => appStore.user);

const signText = ref('');
const signRes = ref('');
const loading = ref(false);

const handleSign = async () => {
  if (!userInfo.value?.name) {
    showFailToast('Please login first!');
    return false;
  }
  if (!signText.value || loading.value) {
    return;
  }
  try {
    signRes.value = '';
    loading.value = true;
    const res = await DFSWallet.sign(signText.value);
    signRes.value = res;
  } catch (error) {
    console.log(error);
  }
  loading.value = false;
};
</script>

<style scoped lang="scss">
.sign {
  max-width: 500px;
  text-align: left;
  display: grid;
  grid-template-columns: 1fr;
  grid-gap: 10px;
  margin: auto;
  margin-top: 50px;
  color: #fff;
  border: 1px solid #666;
  padding: 20px;
  border-radius: 10px;
  .title {
    font-size: 18px;
    text-align: center;
    font-weight: 600;
  }
  .signRes {
    .title {
      text-align: left;
    }
    .res {
      margin-top: 10px;
      padding: 10px;
      background: #222;
      border-radius: 5px;
      word-break: break-all;
    }
  }
}

.item {
  .label {
    margin-bottom: 6px;
    @include flexb;
    .bal {
      cursor: pointer;
    }
  }
  .iptDiv {
    background: #333;
    box-sizing: border-box;
    padding: 0;
    border-radius: 4px;
    @include flexb;
    .chooseToken {
      @include flexc;
      font-size: 15px;
      padding-right: 10px;
      cursor: pointer;
      .coin {
        width: 30px;
        margin-right: 4px;
      }
      .icon {
        font-size: 16px;
        margin-left: 4px;
      }
    }
    .ipt {
      width: 100%;
      height: 45px;
      line-height: 40px;
      font-size: 16px;
      box-sizing: border-box;
      padding: 0 10px;
      background: #333;
      border: 0px solid #eee;
      border-radius: 4px;
      color: #fff;
      &::after {
        display: none;
      }
      :deep(.van-field__control) {
        color: #fff;
      }
    }
  }
}

.btn {
  background: #1989fa;
  width: 100%;
  color: #fff;
  height: 50px;
  margin-top: 20px;
}
</style>
