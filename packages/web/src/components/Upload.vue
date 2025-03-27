<template>
  <div class="upload-container">
    <van-grid :column-num="3" :border="false">
      <van-grid-item>
        <van-uploader :after-read="afterRead" :before-delete="beforeDelete" accept="image/*" multiple :max-count="9" class="custom-uploader">
          <div class="upload-area">
            <van-icon name="photograph" size="24" color="#1989fa" />
            <div class="upload-tips">点击上传照片</div>
            <div class="upload-subtips">单次最多9张</div>
          </div>
        </van-uploader>
      </van-grid-item>
    </van-grid>

    <div class="preview-grid">
      <div v-for="(file, index) in uploadedFiles" :key="index" class="preview-card">
        <div class="image-wrapper">
          <img :src="file.url" alt="上传图片" />
          <div
            class="progress-bar"
            :style="{
              height: 100 - file.progress + '%',
              background: 'linear-gradient(to top, #a0c8ff, #1989fa)'
            }"
          />
        </div>
        <div
          class="status-text"
          :class="{
            'status-uploading': file.status === 'uploading',
            'status-success': file.status === 'success',
            'status-fail': file.status === 'fail'
          }"
        >
          {{ statusText(file.status) }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
  import { ref } from 'vue';
  import axios from 'axios';

  const uploadedFiles = ref([]);
  const uploadUrl = '/api/photos/upload';
  const headers = {};

  const afterRead = async (fileOrFiles) => {
    const files = Array.isArray(fileOrFiles) ? fileOrFiles : [fileOrFiles];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const rid = Math.random();
      file.rid = rid;
      const previewFile = {
        rid,
        url: URL.createObjectURL(file.file),
        status: 'uploading',
        progress: 0
      };
      uploadedFiles.value.push(previewFile);
    }

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      // 添加预览图到uploadedFiles中，并设置初始进度为0
      try {
        const formData = new FormData();
        formData.append('file', file.file); // 将文件添加到 FormData 中

        // 使用 axios 来实现上传进度监听
        await axios
          .post(uploadUrl, formData, {
            headers: headers,
            onUploadProgress: (progressEvent) => {
              if (progressEvent.lengthComputable) {
                const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                const fileIndex = uploadedFiles.value.findIndex((item) => item.rid === file.rid);
                // 更新上传进度
                uploadedFiles.value[fileIndex].progress = percentCompleted;
              }
            }
          })
          .then((response) => {
            const responseData = response.data;
            const fileIndex = uploadedFiles.value.findIndex((item) => item.rid === file.rid);
            if (responseData.code === 0) {
              uploadedFiles.value[fileIndex].status = 'success';
            } else {
              uploadedFiles.value[fileIndex].status = 'fail';
              uploadedFiles.value[fileIndex].progress = 0;
            }
          })
          .catch((error) => {
            console.error('上传出错:', error);
            const fileIndex = uploadedFiles.value.findIndex((item) => item.rid === file.rid);
            uploadedFiles.value[fileIndex].status = 'fail';
            uploadedFiles.value[fileIndex].progress = 0;
          });
      } catch (error) {
        console.error('上传出错:', error);
      }
    }
  };

  const beforeDelete = (file) => {
    return new Promise((resolve) => {
      resolve(window.confirm('确定要删除这张图片吗？'));
    });
  };

  const statusText = (status) => {
    const statusMap = {
      uploading: '上传中',
      success: '上传成功',
      fail: '上传失败'
    };
    return statusMap[status] || '';
  };
</script>

<style scoped>
  .upload-container {
    padding: 16px;
  }

  .custom-uploader {
    width: 100%;
    height: 100%;
    :deep(.van-uploader__wrapper) {
      width: 100%;
      height: 100%;
    }

    :deep(.van-uploader__upload) {
      width: 100%;
      height: 100%;
      margin: 0;
    }
  }

  .upload-area {
    width: 100%;
    height: 100px;
    border: 2px dashed #ebedf0;
    border-radius: 8px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background-color: #fafafa;
    transition: border-color 0.3s;
  }

  .upload-area:active {
    border-color: #1989fa;
  }

  .upload-tips {
    font-size: 14px;
    color: #969799;
    margin-top: 8px;
  }

  .upload-subtips {
    font-size: 12px;
    color: #c8c9cc;
    margin-top: 4px;
  }

  .preview-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
    margin-top: 16px;
  }

  .preview-card {
    position: relative;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  .image-wrapper {
    position: relative;
    width: 100%;
    padding-top: 100%; /* 保持1:1比例 */
  }

  img {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .progress-bar {
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    transition: height 0.3s ease;
  }

  .status-text {
    position: absolute;
    bottom: 4px;
    right: 4px;
    font-size: 12px;
    padding: 2px 6px;
    border-radius: 4px;
    background: rgba(255, 255, 255, 0.9);
  }

  .status-uploading {
    color: #1989fa;
  }

  .status-success {
    color: #07c160;
  }

  .status-fail {
    color: #ee0a24;
  }
</style>

<style scoped>
  .upload-area {
    transition: all 0.3s ease;
  }

  .upload-area:hover {
    border-color: #1989fa;
    background-color: #f5f8ff;
    transform: scale(1.02);
  }

  .preview-card {
    transition: transform 0.2s ease;
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  .preview-card:hover {
    transform: translateY(-2px);
  }

  .status-text {
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(2px);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  .progress-bar {
    background: linear-gradient(to top, #ffffff9a, #ffffffa6) !important;
  }
</style>
