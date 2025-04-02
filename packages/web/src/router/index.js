import { createRouter, createWebHistory } from 'vue-router';
import PageMain from '../pages/PhotoIndex.vue';
import AdminPage from '../pages/AdminPage.vue';
import PasswordLogin from '../pages/PasswordLogin.vue';
import SystemConfig from '../pages/SystemConfig.vue';

const routes = [
  {
    path: '/',
    name: 'PageMain',
    component: PageMain
  },
  {
    path: '/systemconfig',
    name: 'SystemConfig',
    component: SystemConfig
  },
  {
    path: '/admin',
    name: 'AdminPage',
    component: AdminPage
  },
  {
    path: '/login',
    name: 'PasswordLogin',
    component: PasswordLogin
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

export default router;
