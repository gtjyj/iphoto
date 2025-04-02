<template>
  <div class="compression-config">
    <!-- 四个输入框 -->
    <van-field v-model="thumbnailMaxSize" label="缩略图尺寸" type="number" placeholder="请输入缩略图最大尺寸" @blur="saveConfig('thumbMaxPx', thumbnailMaxSize)" />
    <div class="tips">缩略图等比例剪切，最大尺寸，比如原图4000x2000，这里设置1000则会等比例压缩为1000x500</div>
    <van-field v-model="thumbnailQuality" label="缩略图质量" type="number" placeholder="请输入缩略图片质量" @blur="saveConfig('thumbQuality', thumbnailQuality)" />
    <div class="tips">缩略图片压缩质量，10-100</div>
    <van-field v-model="compressedMaxSize" label="高清图尺寸" type="number" placeholder="请输入压缩图最大尺寸" @blur="saveConfig('compressMaxPx', compressedMaxSize)" />
    <div class="tips">高清图等比例剪切，最大尺寸，比如原图4000x2000，这里设置1000则会等比例压缩为1000x500</div>
    <van-field v-model="compressedQuality" label="高清图质量" type="number" placeholder="请输入压缩图质量" @blur="saveConfig('compressQuality', compressedQuality)" />
    <div class="tips">高清图片压缩质量，10-100</div>

    <div class="try-title">在这里上传一张图片，试试压缩效果（上传后等待压缩完成往下滑动查看压缩效果）</div>
    <!-- 上传图片按钮 -->
    <van-uploader :after-read="afterRead" :max-count="1" accept="image/*" :auto-upload="false">
      <template #upload>
        <van-button type="primary">上传图片</van-button>
      </template>
    </van-uploader>

    <div v-if="compressData?.thumb?.base64" class="image-preview">
      <p>
        缩略图 <span v-if="compressData?.thumb?.width">尺寸{{ compressData?.thumb?.width }}x{{ compressData?.thumb?.height }}, 大小{{ compressData?.thumb?.size }}KB</span>
      </p>
      <img :src="`data:image/jpeg;base64,${compressData?.thumb?.base64}`" alt="thumb Image" />
    </div>

    <div v-if="compressData?.hd?.base64" class="image-preview">
      <p>
        压缩高清图 <span v-if="compressData?.hd?.width">尺寸{{ compressData?.hd?.width }}x{{ compressData?.hd?.height }}, 大小{{ compressData?.hd?.size }}KB</span>
      </p>
      <img :src="`data:image/jpeg;base64,${compressData?.hd?.base64}`" alt="Compressed Image" />
    </div>

    <div v-if="originalImageUrl" class="image-preview">
      <p>
        原图
        <span v-if="compressData?.original?.width">尺寸{{ compressData?.original?.width }}x{{ compressData?.original?.height }}, 大小{{ compressData?.original?.size }}KB</span>
      </p>
      <img :src="originalImageUrl" alt="Original Image" />
    </div>
  </div>
</template>

<script setup>
  import { ref } from 'vue';
  import axios from 'axios';
  import { Toast } from 'vant';

  // 定义四个输入框的值
  const thumbnailMaxSize = ref('');
  const thumbnailQuality = ref('');
  const compressedMaxSize = ref('');
  const compressedQuality = ref('');

  axios.post('/api/admin/getCompressConfig').then((res) => {
    thumbnailMaxSize.value = res?.data?.data?.thumbMaxPx;
    thumbnailQuality.value = res?.data?.data?.thumbQuality;
    compressedMaxSize.value = res?.data?.data?.compressMaxPx;
    compressedQuality.value = res?.data?.data?.compressQuality;
  });

  const saveConfig = (key, value) => {
    axios.post('/api/admin/saveConfig', { key, value }).then((response) => {
      if (response.data.code !== 0) {
        Toast.fail('修改失败');
      }
    });
  };

  // 定义原图和压缩后的图片的显示数据
  const originalImageUrl = ref('');

  const compressData = ref(null);
  //   const compressedImageBase64 = ref('');
  //   const thumbImageBase64 = ref('');

  // 处理图片上传后的逻辑
  const afterRead = async (file) => {
    // 显示原图
    originalImageUrl.value = URL.createObjectURL(file.file);

    // 创建表单数据
    const formData = new FormData();
    formData.append('file', file.file);

    try {
      // 发送请求到服务端
      const response = await axios.post('/api/admin/tryCompressFile', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      compressData.value = response?.data?.data;
      //   compressedImageBase64.value = response?.data?.data?.hd;
      //   thumbImageBase64.value = response?.data?.data?.thumb;
    } catch (error) {
      console.error('上传图片失败:', error);
    }
  };
</script>

<style scoped>
  .tips {
    padding-left: 16px;
    margin-bottom: 10px;
    margin-top: 5px;
    font-size: 12px;
    color: gray;
  }
  .image-preview {
    margin-top: 16px;
  }
  .image-preview img {
    max-width: 100%;
    height: auto;
  }
  .try-title {
    margin-top: 50px;
    margin-bottom: 20px;
  }
</style>
