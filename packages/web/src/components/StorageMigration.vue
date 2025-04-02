<template>
  <div>
    <h3>存储迁移</h3>
    <div>
      <label>从：</label>
      <span v-for="type in storageTypes" :key="type">
        <input type="radio" :value="type" v-model="fromStorage" />
        {{ type }}
      </span>
    </div>
    <div>
      <label>到：</label>
      <span v-for="type in storageTypes" :key="type">
        <input type="radio" :value="type" v-model="toStorage" />
        {{ type }}
      </span>
    </div>
    <button @click="handleMigrate">开始迁移</button>
    <div v-if="hasTask">
      <p>待复制: {{ status1 }} 条</p>
      <p>已复制: {{ status2 }} 条</p>
      <p>复制出错: {{ status3 }} 条</p>
    </div>
    <div v-else>当前无执行中无任务</div>
  </div>
</template>

<script setup>
  import { ref, onMounted } from 'vue';
  import axios from 'axios';
  import { Toast } from 'vant';

  // 存储所有存储类型的数组
  const storageTypes = ref([]);
  // 源存储类型
  const fromStorage = ref('');
  // 目标存储类型
  const toStorage = ref('');
  // 任务状态数据
  const status1 = ref(0);
  const status2 = ref(0);
  const status3 = ref(0);
  // 是否有任务
  const hasTask = ref(false);

  const updateStatus = async () => {
    try {
      const response = await axios.post('/api/admin/getTaskStatus');
      status1.value = response.data.data.status1;
      status2.value = response.data.data.status2;
      status3.value = response.data.data.status3;
      hasTask.value = status1.value + status2.value + status3.value > 0;
    } catch (error) {
      console.error('获取任务状态数据失败:', error);
    }
  };
  // 挂载组件时请求存储类型数据
  onMounted(async () => {
    try {
      const response = await axios.post('/api/admin/getStorageType');
      storageTypes.value = response.data.data;
    } catch (error) {
      console.error('获取存储类型数据失败:', error);
    }
    // 每隔 5 秒查询一次任务状态
    setInterval(async () => {
      updateStatus();
    }, 5000);
    updateStatus();
  });

  // 处理迁移按钮点击事件
  const handleMigrate = async () => {
    if (fromStorage.value && toStorage.value) {
      // 这里可以调用迁移数据的接口，如 axios.post('/api/admin/migrateData', { from: fromStorage.value, to: toStorage.value })
      console.log('开始从', fromStorage.value, '迁移到', toStorage.value);
      const response = await axios.post('/api/admin/migrateData', {
        from: fromStorage.value,
        to: toStorage.value
      });
      if (response.data?.code === 0) {
        Toast.success('任务创建成功');
      } else {
        Toast.fail('任务创建失败');
      }
    } else {
      Toast.fail('请选择源存储类型和目标存储类型');
    }
  };
</script>
