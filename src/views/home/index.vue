<template>
  <div>
    <Navs />

    <div class="tip">
      <div>
        该dapp演示了一个dapp如何通过dfs插件钱包或passkey的方式登录，以及如何与dfs区块链进行交互。

        <span class="toGithub" @click="handleToGithub">
          参考代码<van-icon name="arrow" class="rightIcon"
        /></span>
      </div>
    </div>

    <div class="transfer">
      <div class="item">
        <div class="label">From</div>
        <div class="iptDiv">
          <van-field
            class="ipt"
            type="text"
            readonly
            :model-value="userInfo?.name"
            placeholder="Please Login First"
          />
        </div>
      </div>
      <div class="item">
        <div class="label">To</div>
        <div class="iptDiv">
          <van-field
            class="ipt"
            type="text"
            v-model="formData.to"
            autocomplete="off"
            placeholder="Please enter the reciver account"
            @blur="handleRegAccount"
          />
        </div>
      </div>

      <div class="item">
        <div class="label">
          <span>Quantity</span>
          <span class="bal" @click="handleMax">Bal. {{ bal }}</span>
        </div>
        <div class="iptDiv">
          <van-field
            class="ipt"
            type="number"
            v-model="formData.quantity"
            @blur="handleBlur()"
            autocomplete="off"
            placeholder="0.0"
          />
          <div class="chooseToken" @click="showTokens = true">
            <img :src="handleGetCoinImg()" class="coin" />
            <span>{{ chooseToken.symbol }}</span>
            <van-icon name="arrow-down" class="icon" />
          </div>
        </div>
      </div>

      <div class="item">
        <div class="label">Memo</div>
        <div class="iptDiv">
          <van-field
            class="ipt"
            type="text"
            v-model="formData.memo"
            autocomplete="off"
          />
        </div>
      </div>
      <van-button
        type="primary"
        class="btn"
        @click="handleTransact()"
        :loading="reging || loading"
        >Transfer</van-button
      >
    </div>

    <van-popup class="popup" v-model:show="showTokens" closeable round>
      <Tokens @change="handleChangeToken" @close="handleClose" />
    </van-popup>
  </div>
</template>

<script setup lang="ts">
import Navs from '@/components/Navs.vue';
import Tokens from '@/views/home/popup/Tokens.vue';
import useAppStore from '@/store/modules/app';
import { Identity, Token } from '@/types';
import DFSWallet from '@/wallet';
import { showFailToast, showSuccessToast } from 'vant';
import {
  getAccount,
  getCoinImg,
  getCurrencBalance,
  getTableRows,
} from '@/utils/common';
import { Action } from 'eosjs/dist/eosjs-serialize';

const handleToGithub = () => {
  window.open('https://github.com/DFSNetwork/DFS-Wallet-Demo', '_blank');
};

const formData = reactive({
  to: '',
  quantity: '',
  memo: '',
});
const appStore = useAppStore();
const userInfo = computed<Identity | null>(() => appStore.user);
const chooseToken = reactive<Token>({
  symbol: 'DFS',
  contract: 'eosio.token',
  decimal: 8,
});
const showTokens = ref(false);
const handleChangeToken = (_token: Token) => {
  Object.assign(chooseToken, _token);
  showTokens.value = false;
  handleGetGetBal();
};
const handleClose = () => {
  showTokens.value = false;
};

const mkts = ref([]);
const handleGetAllTokens = async () => {
  const params = {
    code: 'swapswapswap',
    scope: 'swapswapswap',
    table: 'markets',
    json: true,
    limit: -1,
  };
  try {
    const res = await getTableRows(params);
    mkts.value = res.rows;
    appStore.setMarkets(res.rows);
  } catch (error) {
    console.error(error);
  }
};
const handleGetCoinImg = () => {
  return getCoinImg({
    symbol: chooseToken.symbol,
    contract: chooseToken.contract,
  });
};
const bal = ref('0 DFS');
const handleGetGetBal = async () => {
  if (!userInfo.value) {
    return;
  }
  try {
    const params = {
      contract: chooseToken.contract,
      symbol: chooseToken.symbol,
      account: userInfo.value?.name,
    };
    const res = await getCurrencBalance(params);
    console.log(res);
    if (!res.length) {
      bal.value = `0 ${chooseToken.symbol}`;
      return;
    }
    bal.value = res[0];
  } catch (error) {
    console.error(error);
  }
};
const handleMax = () => {
  formData.quantity = bal.value.split(' ')[0];
  handleBlur();
};
watch(
  () => userInfo.value?.name,
  () => {
    handleGetGetBal();
  },
  {
    immediate: true,
  }
);

onMounted(() => {
  handleGetAllTokens();
});

const loading = ref(false);
const handelReg = () => {
  if (loading.value) {
    return false;
  }
  if (!userInfo.value?.name) {
    showFailToast('Please login first!');
    return false;
  }
  if (!formData.to) {
    showFailToast('Please enter the reciver account!');
    return false;
  }
  if (!regAccRules.value || !hasAccount.value) {
    showFailToast('The account does not exist!');
    return false;
  }
  if (!formData.quantity) {
    showFailToast('Please enter the quantity!');
    return false;
  }
  if (Number(formData.quantity || 0) > parseFloat(bal.value.split(' ')[0])) {
    showFailToast('The quantity exceeds the balance!');
    return false;
  }
  return true;
};
const handleTransact = async () => {
  if (!handelReg()) {
    return;
  }
  const actions: Action[] = [
    {
      account: chooseToken.contract,
      name: 'transfer',
      authorization: [
        {
          actor: userInfo.value?.name || '',
          permission: userInfo.value?.authority || 'active',
        },
      ],
      data: {
        from: userInfo.value?.name,
        to: formData.to,
        quantity: `${formData.quantity} ${chooseToken.symbol}`,
        memo: formData.memo,
      },
    },
  ];
  try {
    loading.value = true;
    const userinfo = await DFSWallet.transact(actions, {
      useFreeCpu: true,
    });
    console.log(userinfo);
    showSuccessToast('transfer success!');

    setTimeout(() => {
      handleGetGetBal();
    }, 2000);
  } catch (error) {
    console.error(error);
    showFailToast(
      error instanceof Error ? error.message : JSON.stringify(error)
    );
  }
  loading.value = false;
};
const handleBlur = () => {
  if (!Number(formData.quantity || 0)) {
    formData.quantity = '';
    return;
  }
  formData.quantity = Number(formData.quantity).toFixed(chooseToken.decimal);
};
/** 12位账号校验规则 */
const reg = /^[a-z1-5]{12}$/;
const regAccRules = computed(() => {
  return reg.test(formData.to);
});
const reging = ref(false);
const hasAccount = ref(false);
const handleRegAccount = async () => {
  if (!regAccRules.value) {
    hasAccount.value = false;
    reging.value = false;
    return false;
  }
  reging.value = true;
  try {
    const res = await getAccount(formData.to);
    if (res.error) {
      throw res;
    }
    hasAccount.value = true;
  } catch (error) {
    console.error(error);
    hasAccount.value = false;
  }
  reging.value = false;
};
</script>

<style scoped lang="scss">
.tip {
  padding: 10px;
  border-radius: 5px;
  border: 1px solid #ff9d00;
  color: #ff9d00;
  width: fit-content;
  margin: 30px auto;
  .toGithub {
    color: #29d4b0;
    cursor: pointer;
    .rightIcon {
      margin-left: 2px;
    }
  }
}
.transfer {
  max-width: 500px;
  text-align: left;
  display: grid;
  grid-template-columns: 1fr;
  grid-gap: 10px;
  margin: auto;
  margin-top: 50px;
  color: #fff;
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
.popup {
  max-width: 400px;
  width: 100%;
  background: #000;
  border: 1px solid #333;
}
</style>
