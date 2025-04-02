<template>
  <div class="login-container">
    <van-field v-model="password" type="password" placeholder="请输入管理员密码" />
    <van-button @click="login">登录</van-button>
  </div>
</template>

<script setup>
  import { ref } from 'vue';
  import axios from 'axios';
  import { Toast } from 'vant'; // 新增导入vant的Toast组件
  import { useRouter } from 'vue-router'; // 新增导入路由钩子

  const password = ref('');
  const router = useRouter(); // 新增创建路由实例

  const login = async () => {
    try {
      const response = await axios.post('/api/login', {
        password: password.value
      });
      if (response.data.code === 0) {
        Toast.success('登录成功'); // 新增用vant提示密码错误
        localStorage.setItem('userData', response.data.data); // 新增保存数据到localstorage
        const urlParams = new URLSearchParams(window.location.search); // 新增获取URL参数
        const redirect = urlParams.get('redirect'); // 新增获取redirect参数
        setTimeout(() => {
          if (redirect) {
            router.push(redirect); // 新增跳转到指定路由
          } else {
            // 可以添加默认跳转逻辑，例如跳转到首页
            router.push('/admin');
          }
        }, 500);
      } else {
        console.error('登录失败:', response.data.msg);
        Toast.fail('密码错误'); // 新增用vant提示密码错误
      }
    } catch (error) {
      console.error('登录失败:', error);
      Toast.fail('密码错误'); // 新增用vant提示密码错误
    }
  };
</script>

<style scoped>
  .login-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding-top: 10vh;
    height: 100vh;
    background-color: #2c3e50; /* 调整背景颜色为深灰色 */
  }

  .van-field {
    width: 80%; /* 可以根据需要调整宽度 */
    background-color: #ecf0f1; /* 输入框背景颜色 */
    border: none; /* 去除边框 */
    border-radius: 5px; /* 圆角 */
    padding: 10px; /* 内边距 */
    margin-bottom: 20px; /* 底部外边距 */
  }

  .van-button {
    width: 80%; /* 与输入框宽度一致 */
    color: white;
    background-color: #3498db; /* 按钮背景颜色 */
    border: none; /* 去除边框 */
    border-radius: 5px; /* 圆角 */
    padding: 10px; /* 内边距 */
    cursor: pointer; /* 鼠标指针样式 */
    transition: background-color 0.3s ease; /* 过渡效果 */
  }

  .van-button:hover {
    background-color: #2980b9; /* 鼠标悬停时的按钮背景颜色 */
  }
</style>

// 引入vant的输入框和按钮组件 import { VanField, VanButton } from 'vant';
