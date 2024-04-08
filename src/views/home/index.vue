<template>
  <div>
    <div class="navs">
      <img src="https://dfs.land/assets/icons/180x180.png" class="logo" />
      <div>
        <button class="login" v-if="!userInfo" @click="handleLogin">
          Login
        </button>
        <div v-else>
          {{ userInfo.name }}
          <button @click="handleLogout" class="logout">Logout</button>
        </div>
      </div>
    </div>
    <div class="transfer">
      <div class="item">
        <div class="label">From</div>
        <input class="ipt" type="text" readonly :value="userInfo?.name" />
      </div>
      <div class="item">
        <div class="label">To</div>
        <input
          class="ipt"
          type="text"
          v-model="formData.to"
          autocomplete="off"
        />
      </div>

      <div class="item">
        <div class="label">Quantity</div>
        <input
          class="ipt"
          type="number"
          v-model="formData.quantity"
          @blur="handleBlur()"
          autocomplete="off"
        />
      </div>

      <div class="item">
        <div class="label">Memo</div>
        <input
          class="ipt"
          type="text"
          v-model="formData.memo"
          autocomplete="off"
        />
      </div>
      <button class="btn" @click="handleTransact()">Transfer</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Identity } from '@/types';
import WebSdk from '@/webSdk';
let webSdk = new WebSdk(
  'DFS Transfer Demo',
  'https://dfs.land/assets/icons/180x180.png'
);
const formData = reactive({
  to: '',
  quantity: '',
  memo: '',
});
const userInfo = ref<Identity | null>(null);
const handleLogin = async () => {
  try {
    userInfo.value = await webSdk.login();
  } catch (error) {
    alert(error);
  }
};
const handleTransact = async () => {
  if (!userInfo.value) {
    alert('Please login first!');
    return;
  }
  const actions = [
    {
      account: 'eosio.token',
      name: 'transfer',
      authorization: [
        {
          actor: userInfo.value?.name,
          permission: userInfo.value?.authority || 'active',
        },
      ],
      data: {
        from: userInfo.value?.name,
        to: formData.to,
        quantity: `${formData.quantity} DFS`,
        memo: formData.memo,
      },
    },
  ];
  try {
    const userinfo = await webSdk.transact(actions);
    console.log(userinfo);
    alert('transfer success!');
  } catch (error) {
    alert(JSON.stringify(error));
  }
};
const handleLogout = async () => {
  userInfo.value = null;
};
const handleBlur = () => {
  if (!Number(formData.quantity || 0)) {
    formData.quantity = '';
    return;
  }
  formData.quantity = Number(formData.quantity).toFixed(8);
};
</script>

<style scoped>
.navs {
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: #fff;
}
.logo {
  width: 50px;
}
.login {
  background: #1989fa;
  height: 50px;
  color: #fff;
}
.logout {
  margin-left: 10px;
  background: #a63a29;
  color: #fff;
}
.transfer {
  width: 300px;
  text-align: left;
  display: grid;
  grid-template-columns: 1fr;
  grid-gap: 10px;
  margin: auto;
  margin-top: 50px;
  color: #fff;
}
.ipt {
  width: 100%;
  height: 40px;
  line-height: 40px;
  font-size: 16px;
  box-sizing: border-box;
  padding: 0 10px;
  background: #333;
  border: 0px solid #eee;
  border-radius: 4px;
  color: #fff;
}
.btn {
  background: #1989fa;
  width: 100%;
  color: #fff;
  height: 50px;
  margin-top: 20px;
}
</style>
