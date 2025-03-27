<template>
  <div class="system-config">
    <div class="tips">
      <van-notice-bar color="#1989fa" background="#ecf9ff" left-icon="info-o">
        系统参数请谨慎修改, 修改后会导致服务重启，如遇修改后无法访问服务、服务无法启动请到服务器查看日志【{{ logPath }}】
      </van-notice-bar>
    </div>
    <van-button type="danger" size="small" @click="router.push('/systemconfig')"> 已知晓, 去修改 </van-button>

    <div class="log-control">
      <van-button type="primary" size="small" @click="fetchLogs">手动刷新日志</van-button>
    </div>
    <div class="tips">最新的200条日志</div>
    <div class="logs" ref="logsRef">
      <pre v-if="logLines.length" :style="{ whiteSpace: 'pre-wrap' }">{{ logLines.join('\n') }}</pre>
    </div>
  </div>
</template>

<script setup>
  import { ref, onMounted, onUnmounted, watch } from 'vue';
  import { useRouter } from 'vue-router';
  import axios from 'axios';

  const router = useRouter();
  const logPath = ref('');
  const logtext = ref('');
  let refreshInterval = null;
  // 定义日志容器的 ref
  const logsRef = ref(null);

  axios.post('/api/admin/getLogPath').then((res) => {
    logPath.value = res?.data?.data;
  });
  const logLines = ref([]);
  const fetchLogs = async () => {
    try {
      const [logTextRes] = await Promise.all([axios.post('/api/admin/getLatestLog')]);
      logLines.value = logTextRes?.data?.data;
    } catch (error) {
      console.error('获取日志失败:', error);
    }
  };

  axios.post('/api/admin/getLatestLog').then((res) => {
    logtext.value = res?.data?.data;
    logLines.value = logtext.value.split('\n');
  });

  // 定义滚动到日志底部的函数
  const scrollToBottom = () => {
    if (logsRef.value) {
      logsRef.value.scrollTop = logsRef.value.scrollHeight;
    }
  };

  onMounted(async () => {
    await fetchLogs();
    refreshInterval = setInterval(fetchLogs, 5000);
    // 挂载后滚动到日志底部
    scrollToBottom();
  });

  // 监听日志内容变化，变化时滚动到日志底部
  watch(logLines, () => {
    scrollToBottom();
  });

  onUnmounted(() => {
    clearInterval(refreshInterval);
  });
</script>

<style scoped lang="less">
  .tips {
    font-size: 14px;
    padding: 10px 0;
    color: gray;
  }
  .log-control {
    margin-top: 50px;
    padding: 10px 0;
  }
  .logs {
    background-color: #000;
    color: #fff;
    padding: 10px;
    border-radius: 4px;
    overflow-y: auto;
    height: 600px;
    max-height: 800px;
    font-family: monospace;
  }
</style>
