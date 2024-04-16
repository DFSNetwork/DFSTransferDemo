import { createRouter, createWebHistory } from "vue-router"

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('@/views/home/index.vue')
  },
]
// 路由
const router = createRouter({
  history: createWebHistory(),
  routes
})
// 导出
export default router
