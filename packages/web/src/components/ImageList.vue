<template>
  <div class="image-list">
    <div class="image-list-title">
      <h2>图片列表</h2>
      <van-button type="primary" size="small" @click="showUploadModal = true">上传图片</van-button>
    </div>
    <div>
      <div v-if="images.length === 0" class="no-data-tip">暂无图片数据哦~</div>
      <div class="image-list-container" v-else>
        <div class="image-item" v-for="(image, index) in images" :key="index">
          <img :src="image.thumb" style="width: 100px; height: 100px" alt="图片缩略图" />
          <div class="image-info">
            <div>文件名: {{ image.originalFileName }}</div>
            <div>创建时间: {{ image.createdAt }}</div>
            <div>原始尺寸: {{ image.width }}x{{ image.height }}</div>
          </div>
          <div class="delete-wrapper">
            <van-popover v-model:show="image.showDelete" @select="onSelect(image.fileKey)" theme="dark" :actions="actions">
              <template #reference>
                <van-icon name="delete-o" class="delete-icon" />
              </template>
            </van-popover>
          </div>
        </div>
      </div>
    </div>
    <!-- 分页信息显示 -->
    <div class="pagination-info">
      <span>当前页: {{ currentPage }}</span>
      <span>总页数: {{ Math.ceil(totalImages / itemsPerPage) }}</span>
      <span>总图片数: {{ totalImages }}</span>
      <span>每页显示: <van-stepper v-model="itemsPerPage" min="10" :max="Math.ceil(totalImages / 10) * 10" step="10" /></span>
    </div>
    <!-- 翻页按钮 -->
    <div class="pagination-buttons">
      <van-button @click="prevPage" :disabled="currentPage === 1">上一页</van-button>
      <van-button @click="nextPage" :disabled="currentPage === Math.ceil(totalImages / itemsPerPage)">下一页</van-button>
    </div>
    <Modal
      v-model:visible="showUploadModal"
      :title="上传图片"
      :onClose="
        () => {
          currentPage = 1;
          fetchImages(currentPage, itemsPerPage);
        }
      "
      width="90%"
      height="600px"
    >
      <Upload />
    </Modal>
  </div>
</template>

<script setup>
  import { onMounted, ref, watch } from 'vue';
  import axios from 'axios';
  import { Toast } from 'vant';
  import Modal from '../components/Modal.vue';
  import Upload from '../components/Upload.vue';

  const onSelect = (fileKey) => {
    if (fileKey) {
      axios.post('/api/photos/delete', { fileKey }).then((response) => {
        if (response.data.code === 0) {
          Toast.success('删除成功');
          fetchImages(currentPage.value, itemsPerPage.value);
        } else {
          Toast.fail('删除失败');
        }
      });
    }
  };

  const showUploadModal = ref(false);
  const actions = [{ text: '删除' }, { text: '取消' }];

  // 图片列表数据
  const totalImages = ref(0);
  const currentPage = ref(1);
  const itemsPerPage = ref(20);
  const images = ref([]);

  watch(itemsPerPage, () => {
    currentPage.value = 1;
    fetchImages(currentPage.value, itemsPerPage.value);
  });

  onMounted(() => {
    fetchImages(currentPage.value, itemsPerPage.value);
  });

  const fetchImages = async (page, limit) => {
    // currentPage.value = page;
    // images.value = [];
    axios
      .post('/api/admin/getList', {
        page,
        limit
      })
      .then((res) => {
        const { list, total } = res.data.data;
        totalImages.value = total;
        images.value = list.map((o) => {
          o.thumb = `/api/photos/image/${o.fileKey}`;
          o.hd = `/api/photos/hd/${o.fileKey}`;
          const date = new Date(o.createdAt);
          const formatter = new Intl.DateTimeFormat('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
          });
          o.createdAt = formatter.format(date);
          // 格式化文件大小
          return o;
        });
      });
  };

  // 上一页
  const prevPage = () => {
    if (currentPage.value > 1) {
      currentPage.value--;
      fetchImages(currentPage.value, itemsPerPage.value);
    }
  };

  // 下一页
  const nextPage = () => {
    if (currentPage.value < Math.ceil(totalImages.value / itemsPerPage.value)) {
      currentPage.value++;
      fetchImages(currentPage.value, itemsPerPage.value);
    }
  };
</script>

<style lang="less" scoped>
  .image-list {
    .image-list-title {
      display: flex;
      align-items: center;
      gap: 30px;
    }
  }
  .image-list-container {
    display: flex;
    gap: 20px;
    flex-wrap: wrap;
    .image-item {
      width: 200px;
      display: flex;
      flex-direction: column;
      align-items: center;
      margin-bottom: 20px;
      background-color: #f9f9f9;
      border: 1px solid #ddd;
      color: rgb(116, 116, 116);
      border-radius: 8px;
      padding: 10px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      position: relative;
      transition: all 0.3s ease; // 添加过渡效果

      // 鼠标悬停时的样式
      &:hover {
        color: rgb(47, 47, 47);
        background-color: #e9e9e9; // 改变背景颜色
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2); // 增加阴影效果
        .delete-wrapper {
          display: block;
        }
      }
    }

    .delete-wrapper {
      visibility: hidden;
      opacity: 0;
      position: absolute;
      top: 8px;
      right: 8px;
      z-index: 2;
      padding: 4px;
      background: rgba(255, 255, 255, 0.9);
      border-radius: 50%;
      cursor: pointer;
      transition: opacity 0.1s ease-in-out;
      &:hover {
        background-color: rgba(255, 128, 128, 0.02);
      }
    }

    .image-item:hover {
      .delete-wrapper {
        visibility: visible;
        opacity: 1;
      }
    }

    .delete-icon {
      font-size: 20px;
      color: #ee0a24;
      transition: opacity 0.2s;
    }

    .delete-icon:hover {
      opacity: 0.8;
      cursor: pointer;
    }
    .image-info {
      margin-top: 10px;
      font-size: 12px;
      text-align: left;
      width: 100%;
      > div {
        white-space: nowrap;
        /* 隐藏溢出内容 */
        overflow: hidden;
        /* 超出部分显示省略号 */
        text-overflow: ellipsis;
        /* 需设置宽度，否则无效 */
        width: 100%;
      }
    }
  }
  .pagination-info {
    margin-top: 20px;
    font-size: 14px;
    text-align: center;
    color: #666;
    > span {
      margin: 0 5px;
    }
  }
  .pagination-buttons {
    margin-top: 10px;
    display: flex;
    justify-content: center;
  }
  .no-data-tip {
    text-align: center;
    font-size: 16px;
    color: #999;
    margin-top: 20px;
  }
</style>
