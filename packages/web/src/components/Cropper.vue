<template>
  <div class="upload-contianer" style="background: linear-gradient(135deg, #e6f7ff, #f0f9ff); background-image: url('@/assets/background.svg'); background-size: cover">
    <van-uploader :after-read="handleAfterRead" accept="image/*" :max-count="1">
      <div
        class="upload-area"
        :style="{
          width: props.previewWidth + 'px',
          height: props.previewHeight + 'px'
        }"
      >
        <template v-if="!clipImg">
          <van-icon name="photograph" size="24" color="#1989fa" />
          <div class="upload-tips">点击上传图片</div>
        </template>
        <template v-if="clipImg">
          <img
            :src="clipImg"
            :style="{
              width: props.previewWidth + 'px',
              height: props.previewHeight + 'px'
            }"
          />
        </template>
      </div>
    </van-uploader>
    <div v-if="showCropModal" class="modal-overlay">
      <div class="modal-content">
        <div id="cropper-container" style="width: 100%; height: 600px">
          <img ref="imageRef" :src="tempImageUrl" alt="待裁剪图片" />
        </div>
        <div class="crop-actions">
          <van-button @click="cancelCrop">取消</van-button>
          <van-button type="primary" @click="confirmCrop">确认</van-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
  import { ref, nextTick, watch } from 'vue';
  import Cropper from 'cropperjs';
  import 'cropperjs/dist/cropper.css';

  const props = defineProps({
    modelValue: {
      type: String
    },
    previewWidth: {
      type: Number,
      default: 200
    },
    previewHeight: {
      type: Number,
      default: 200
    },
    cropWidth: {
      type: Number,
      default: 200
    },
    cropHeight: {
      type: Number,
      default: 200
    }
  });
  const clipImg = ref(props.modelValue);

  watch(
    () => props.modelValue,
    (newValue) => {
      clipImg.value = newValue;
    }
  );

  const emits = defineEmits(['update:modelValue', 'change']);

  const imageRef = ref(null);
  const showCropModal = ref(false);
  const tempImageUrl = ref('');
  let cropper = null;

  const handleAfterRead = (file) => {
    tempImageUrl.value = URL.createObjectURL(file.file);
    showCropModal.value = true;
    nextTick(() => {
      cropper = new Cropper(imageRef.value, {
        aspectRatio: props.cropWidth / props.cropHeight,
        viewMode: 1,
        dragMode: 'move',
        autoCropArea: 1,
        restore: false,
        guides: false,
        center: false,
        highlight: false,
        cropBoxMovable: false,
        cropBoxResizable: false,
        ready() {
          // 获取图片的原始宽度和高度
          const imgWidth = this.cropper.imageData.naturalWidth;
          const imgHeight = this.cropper.imageData.naturalHeight;
          // 获取裁剪框的宽度和高度
          const cropBoxWidth = props.cropWidth;
          const cropBoxHeight = props.cropHeight;
          // 计算缩放比例
          const scaleX = cropBoxWidth / imgWidth;
          const scaleY = cropBoxHeight / imgHeight;
          const scale = Math.min(scaleX, scaleY);
          // 对图片进行缩放
          this.cropper.scaleX(scale);
          this.cropper.scaleY(scale);
          // 调整图片位置使其居中
          this.cropper.setCanvasData({
            left: (cropBoxWidth - imgWidth * scale) / 2,
            top: (cropBoxHeight - imgHeight * scale) / 2
          });
        }
      });
    });
  };

  const cancelCrop = () => {
    showCropModal.value = false;
    cropper.destroy();
    URL.revokeObjectURL(tempImageUrl.value);
  };

  const confirmCrop = () => {
    const canvas = cropper.getCroppedCanvas();
    const base64Image = canvas.toDataURL('image/jpeg');
    emits('update:modelValue', base64Image);
    emits('change', base64Image);
    clipImg.value = base64Image;
    showCropModal.value = false;
    cropper.destroy();
    URL.revokeObjectURL(tempImageUrl.value);
  };
</script>

<style scoped>
  .modal-overlay {
    z-index: 9;
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100vh;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .modal-content {
    background-color: white;
    padding: 20px;
    border-radius: 8px;
    width: 80%;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  }

  .crop-actions {
    display: flex;
    justify-content: space-around;
    padding: 10px;
  }
  .upload-area {
    border: 2px dashed #ebedf0;
    border-radius: 8px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background-color: rgba(255, 255, 255, 0.8);
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
</style>
