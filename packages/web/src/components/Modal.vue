<template>
  <div v-if="visible" class="modal-overlay">
    <div class="modal" :style="{ width: width, height: height }">
      <!-- 新增一个 div 来包裹标题和关闭按钮 -->
      <div class="modal-header">
        <button @click="closeModal" class="close-button"><van-icon name="cross" /></button>
        <!-- 新增：显示标题 -->
        <h2 class="modal-title">{{ title }}</h2>
      </div>
      <!-- 新增一个 div 用于包裹内容，使其可以滚动 -->
      <div class="modal-content">
        <slot />
      </div>
    </div>
  </div>
</template>

<script setup>
  // 定义 props
  const props = defineProps({
    // 控制模态框的显示与隐藏
    visible: {
      type: Boolean,
      default: false
    },
    // 模态框的宽度
    width: {
      type: String,
      default: '500px'
    },
    // 模态框的高度
    height: {
      type: String,
      default: '300px'
    },
    // 新增：模态框的标题
    title: {
      type: String,
      default: '默认标题'
    },
    // 新增：关闭事件回调
    onClose: {
      type: Function,
      default: () => {}
    }
  });

  // 定义自定义事件
  const emits = defineEmits(['update:visible']);

  // 关闭模态框的方法
  const closeModal = () => {
    emits('update:visible', false);
    // 调用传入的关闭事件回调
    props?.onClose();
  };
</script>

<style scoped>
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
  }

  .modal {
    background-color: white;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    position: relative;
    display: flex;
    flex-direction: column;
    height: 100%; /* 确保模态框高度占满父容器 */
  }

  /* 模态框头部样式 */
  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 20px;
    position: sticky; /* 固定头部 */
    top: 0;
    background-color: white; /* 防止内容滚动到头部下方时遮挡 */
    z-index: 1; /* 确保头部显示在内容之上 */
  }

  /* 标题样式 */
  .modal-title {
    margin: 20px 20px 10px;
    font-size: 1.2em;
    font-weight: bold;
  }

  /* 模态框内容样式 */
  .modal-content {
    overflow: auto; /* 当内容超出高度时显示滚动条 */
    flex: 1; /* 让内容区域占据剩余空间 */
  }

  /* 关闭按钮样式 */
  .close-button {
    position: absolute;
    top: 10px;
    right: 10px;
    background: none;
    border: none;
    cursor: pointer;
    font-size: 18px;
  }
</style>
