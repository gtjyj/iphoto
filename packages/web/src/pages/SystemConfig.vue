<template>
  <div class="form-container">
    <div style="font-size: 20px; margin-bottom: 20px">首次使用，请先配置系统参数</div>
    <form @submit.prevent="onSubmit">
      <div v-for="item in initData" :key="item.key" class="form-item" :style="{ display: shouldShow(item) ? 'block' : 'none' }">
        <label class="form-label">{{ item.label }}</label>
        <template v-if="item.type === 'text' || item.type === 'password'">
          <input v-model="formData[item.key]" class="form-input" :type="item.type" :name="item.key" />
          <span v-if="item.placeholder" style="color: #909399; font-size: 12px; display: block; margin-top: 4px">
            {{ item.placeholder }}
          </span>
          <span v-if="item.require" style="color: red; font-size: 12px">必填</span>
        </template>
        <template v-else-if="item.type === 'radio'">
          <div class="radio-group">
            <label v-for="option in item.options" :key="option.key">
              <input type="radio" :name="item.key" :value="option.key" v-model="formData[item.key]" />
              {{ option.label }}
            </label>
          </div>
          <span v-if="item.placeholder" style="color: #909399; font-size: 12px; display: block; margin-top: 4px">
            {{ item.placeholder }}
          </span>
        </template>
      </div>
      <button class="submit-button" :disabled="isSubmitting" type="submit">
        {{ submitButtonText }}
        <span v-if="isSubmitting" class="button-loading"></span>
      </button>
    </form>
  </div>
</template>

<script setup>
  import { ref, onMounted } from 'vue';
  import axios from 'axios';
  import { Toast } from 'vant';
  import { useRouter } from 'vue-router'; // 新增导入路由钩子
  const router = useRouter(); // 新增创建路由实例

  const initData = ref([]);
  const isEdit = ref(false);
  const formData = ref({});
  const isSubmitting = ref(false);
  const submitButtonText = ref('提交');

  const getFormValue = () => {
    return initData.value.reduce((pre, item) => {
      if (item.type === 'radio') {
        pre[item.key] = formData.value[item.key];
      } else {
        pre[item.key] = formData.value[item.key];
      }
      return pre;
    }, {});
  };

  //   const checkWhen = () => {
  //     const values = getFormValue();
  //     initData.value.forEach((item) => {
  //       if (item.when) {
  //         const shouldShow = item.when.every((condition) => {
  //           return values[condition.key] === condition.value;
  //         });
  //       }
  //     });
  //   };

  const shouldShow = (item) => {
    if (item.when) {
      const values = getFormValue();
      return item.when.every((condition) => {
        return values[condition.key] === condition.value;
      });
    }
    return true;
  };

  const startPolling = () => {
    const source = axios.CancelToken.source();
    const timeoutId = setTimeout(() => source.cancel('请求超时'), 5000);

    axios
      .get('/api/ready', { cancelToken: source.token })
      .then((response) => {
        clearTimeout(timeoutId);
        const text = response.data;
        if (text.trim() === 'ready') {
          window.location.href = '/login';
        } else {
          setTimeout(startPolling, 10000);
        }
      })
      .catch((error) => {
        if (axios.isCancel(error)) {
          console.log('请求被取消:', error.message);
        } else {
          console.error('轮询错误:', error);
        }
        setTimeout(startPolling, 10000);
      });
  };

  const onSubmit = async () => {
    let hasEmptyField = false;
    initData.value.forEach((item) => {
      // 仅检查显示的字段是否为必填项
      if (shouldShow(item) && item.require) {
        if (!formData.value[item.key]) {
          hasEmptyField = true;
        }
      }
    });

    if (hasEmptyField) {
      alert('请填写所有必填项');
      return;
    }

    isSubmitting.value = true;
    submitButtonText.value = `提交`;

    try {
      const response = await axios.post('/api/submitConfig', formData.value, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const data = response.data;
      if (data.code !== 0) {
        Toast.fail(data.msg);
        isSubmitting.value = false;
        submitButtonText.value = '提交';
      } else {
        if (isEdit.value) {
          Toast.success(data.msg);
          router.push('/admin'); // 新增跳转到指定路由
        } else {
          submitButtonText.value = `正在初始化系统，完成后会自动跳转登录页`;
          setTimeout(() => {
            startPolling();
          }, 10000);
        }
      }
    } catch (error) {
      console.error('Error:', error);
      alert('提交失败');
      isSubmitting.value = false;
      submitButtonText.value = '提交';
    }
  };

  onMounted(async () => {
    try {
      const res = await axios.post('/api/getConfig');
      const response = await axios.get('/api/getConfigTemplate');
      initData.value = response.data;

      if (res?.data?.data && Object.keys(res?.data?.data)?.length) {
        isEdit.value = true;
        initData.value.forEach((item) => {
          formData.value[item.key] = res?.data?.data?.[item.key] || item.value;
        });
      } else {
        // 初始化表单数据
        initData.value.forEach((item) => {
          if (item.type === 'radio') {
            formData.value[item.key] = item.options[0].key;
          } else {
            formData.value[item.key] = item.value || '';
          }
        });
      }

      //   checkWhen();
    } catch (error) {
      console.error('获取配置数据失败:', error);
    }
  });
</script>

<style scoped>
  body {
    font-family: Arial, sans-serif;
    padding: 20px;
    background-color: gray;
  }

  .form-container {
    background: white;
    max-width: 600px;
    margin: 0 auto;
    border: 1px solid #dcdfe6;
    border-radius: 4px;
    padding: 20px;
  }

  .form-item {
    margin-bottom: 20px;
  }

  .form-label {
    display: block;
    margin-bottom: 5px;
    font-weight: bold;
  }

  .form-input {
    width: 100%;
    padding: 8px;
    border: 1px solid #dcdfe6;
    border-radius: 4px;
    box-sizing: border-box;
  }

  .form-radio {
    margin-right: 10px;
  }

  .submit-button {
    background-color: #409eff;
    color: white;
    padding: 10px 20px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    position: relative;
  }

  .submit-button:disabled {
    background-color: #a0cfff;
    cursor: not-allowed;
  }

  .button-loading {
    display: inline-block;
    width: 16px;
    height: 16px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-radius: 50%;
    border-top-color: #fff;
    animation: spin 1s ease-in-out infinite;
    margin-left: 8px;
    vertical-align: middle;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  .submit-button:hover {
    background-color: #3a8ee6;
  }
</style>
