<template>
  <div class="admin-page">
    <van-tabs v-model:active="active">
      <van-tab title="网站配置">
        <div class="tab-container">
          <SiteConfig v-if="active === 0" />
        </div>
      </van-tab>
      <van-tab title="图片管理">
        <div class="tab-container">
          <ImageList v-if="active === 1" />
        </div>
      </van-tab>

      <van-tab title="压缩参数">
        <div class="tab-container">
          <CompressionConfig v-if="active === 2" />
        </div>
      </van-tab>
      <van-tab title="存储迁移">
        <div class="tab-container">
          <!-- <StorageMigration v-if="3" /> -->
          存储迁移比较麻烦，还没时间来实现完，具体怎么做也还在思考中, 加上迁移数据可以手动操作，所以先挂着，有时间再做。
        </div>
      </van-tab>
      <van-tab title="系统参数">
        <div class="tab-container">
          <SystemTab v-if="active === 4" />
        </div>
      </van-tab>
    </van-tabs>
  </div>
</template>

<script setup>
  import { ref } from 'vue';
  import SiteConfig from '../components/SiteConfig.vue';
  import ImageList from '../components/ImageList.vue';
  import SystemTab from '../components/SystemTab.vue';
  import CompressionConfig from '../components/CompressionConfig.vue';
  // import StorageMigration from '../components/StorageMigration.vue';

  // 初始化激活的标签页索引
  const active = ref(0);
</script>

<style lang="less" scoped>
  .admin-page {
    padding: 16px;
  }
  .tab-container {
    padding: 16px;
    border-top: 1px solid #e3e3e3;
  }
  .tips {
    font-size: 14px;
    padding: 10px 0;
    color: gray;
  }
</style>
