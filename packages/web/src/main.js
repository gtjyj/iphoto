import { createApp } from 'vue';
import App from './App.vue';
import route from './router/index.js';
import axios from 'axios';
import { Lazyload } from 'vant';
import 'vant/es/toast/style';
const app = createApp(App);
app.use(route);
app.use(Lazyload);
app.mount('#app');
if ('{__VAR_siteName__}'.includes('__VAR_siteName__')) {
  document.title = 'i-photo';
}
axios.interceptors.request.use(
  (config) => {
    const userData = localStorage.getItem('userData');
    if (userData) {
      config.headers.authorization = userData;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

axios.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('userData');
      const currentRoute = route.currentRoute.value.fullPath;
      const urlParams = new URLSearchParams(currentRoute.split('?')[1] || '');
      const redirect = urlParams.has('redirect') ? urlParams.get('redirect') : currentRoute.split('?')[0];
      route.push({ name: 'PasswordLogin', query: { redirect } });
    }
    return Promise.reject(error);
  }
);
