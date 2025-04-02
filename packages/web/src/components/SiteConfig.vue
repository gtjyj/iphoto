<template>
  <div class="site-config">
    <h2>网站配置</h2>
    <van-form>
      <van-field v-model="siteName" label="网站标题" placeholder="设置网站标题" @blur="saveConfig('siteName', siteName)" />
      <div class="tips">网站标题作用于浏览器title</div>
      <van-field v-model="nick" label="用户昵称" placeholder="设置用户昵称" @blur="saveConfig('nick', nick)" />
      <div class="tips">用户昵称会显示到图片展示页面的顶部头像下方</div>
      <van-field v-model="desc" label="一句描述" placeholder="请输入网站描述" @blur="saveConfig('desc', desc)" />
      <div class="tips">一句描述展示到图片展示页面的顶部，不建议太长</div>
      <van-field v-model="domain" label="分享时的域名" placeholder="请输入分享域名" @blur="saveConfig('domain', domain)" />
      <div class="tips">这里设置你的访问域名, 分享时的二维码生成、防盗链的检测都会使用, 必须配置例如https://example.com</div>
      <van-field v-model="keywords" label="seo keywords" placeholder="seo keywords 多个英文逗号分隔" @blur="saveConfig('keywords', keywords)" />
      <div class="tips">如果你需要seo关键词，设置到这里，多个关键词英文逗号分隔</div>
      <van-field label="网站图标">
        <template #input>
          <van-uploader :after-read="afterRead" accept="image/*" :max-count="1" class="custom-uploader">
            <div class="upload-area" v-if="!icon">
              <van-icon name="photograph" size="24" color="#1989fa" />
            </div>
            <img :src="icon" style="width: 30px; height: 30px" v-if="icon" />
          </van-uploader>
        </template>
      </van-field>
      <div class="tips">网站的图片，后缀名为.ico，修改直接点击图标</div>
      <van-field label="选择头像">
        <template #input>
          <Cropper
            v-model="avatar"
            @change="
              (v) => {
                uploadFile('avatar', v);
              }
            "
            :cropWidth="100"
            :cropHeight="100"
            :previewWidth="100"
            :previewHeight="100"
          />
        </template>
      </van-field>
      <div class="tips">您的头像，会展示到图片展示页面顶部，修改直接点击图片</div>
      <van-field label="选择头图">
        <template #input>
          <Cropper
            v-model="header"
            @change="
              (v) => {
                uploadFile('header', v);
              }
            "
            :cropWidth="1000"
            :cropHeight="400"
            :previewWidth="500"
            :previewHeight="200"
          />
        </template>
      </van-field>
      <div class="tips">头图，会展示到图片展示页面顶部作为背景图，修改直接点击图片</div>
      <!-- 将按钮绑定 disabled 属性 -->
      <van-button type="primary" size="small" @click="onApplySiteConfig" :disabled="isApplyingConfig">
        {{ isApplyingConfig ? '处理中, 请耐心等待...' : '应用设置' }}
      </van-button>
    </van-form>
  </div>
</template>

<script setup>
  import { onMounted, ref } from 'vue';
  import axios from 'axios';
  import Cropper from '../components/Cropper.vue';
  import { Toast } from 'vant';
  import { ConfigFetcher } from '../libs/config';

  const isApplyingConfig = ref(false);

  const onApplySiteConfig = () => {
    if (isApplyingConfig.value) {
      Toast.fail('请耐心等待上次执行结果');
      return;
    }
    Toast.loading('正在执行，请稍后');
    isApplyingConfig.value = true;
    setTimeout(() => {
      axios
        .post('/api/admin/syncConfigToWeb', {})
        .then((response) => {
          if (response.data.code === 0) {
            Toast.success(response.data.msg);
          } else {
            Toast.fail('应用失败');
          }
          // 请求完成后启用按钮
          isApplyingConfig.value = false;
        })
        .catch(() => {
          Toast.fail('应用失败');
          // 出错时也启用按钮
          isApplyingConfig.value = false;
        });
    }, 1000);
  };

  // 网站配置数据
  const keywords = ref('');
  const icon = ref('');
  const siteName = ref('');
  const nick = ref('');
  const desc = ref('');
  const domain = ref('');
  const avatar = ref('');
  const header = ref('');

  onMounted(() => {
    ConfigFetcher.getInstance()
      .getAllConfigs()
      .then((data) => {
        avatar.value = data.avatar ? `/${data.avatar}` : '';
        header.value = data.header ? `/${data.header}` : '';
        siteName.value = data.siteName || '';
        nick.value = data.nick || '';
        desc.value = data.desc || '';
        domain.value = data.domain || '';
        icon.value = data.icon || '';
        keywords.value = data.keywords || '';
      });
  });

  const afterRead = async (file) => {
    // const file = Array.isArray(fileOrFiles) ? fileOrFiles : [fileOrFiles];
    uploadFile('icon', file.file);
    icon.value = URL.createObjectURL(file.file);
  };

  const saveConfig = (key, value) => {
    axios.post('/api/admin/saveConfig', { key, value }).then((response) => {
      if (response.data.code === 0) {
        // Toast.fail('修改成功');
      } else {
        Toast.fail('修改失败');
      }
    });
  };

  const base64ToFile = (base64Data, fileName = 'example.jpg') => {
    const parts = base64Data.split(';base64,');
    const contentType = parts[0].split(':')[1];
    const rawBase64 = parts[1];

    // 将 base64 数据转换为 Uint8Array
    const byteCharacters = atob(rawBase64);
    const byteArrays = [];
    for (let i = 0; i < byteCharacters.length; i++) {
      byteArrays.push(byteCharacters.charCodeAt(i));
    }
    const byteArray = new Uint8Array(byteArrays);

    // 创建 Blob 对象
    const blob = new Blob([byteArray], { type: contentType });

    const file = new File([blob], fileName, { type: contentType });
    return file;
  };

  const uploadFile = async (key, base64) => {
    const formData = new FormData();
    formData.append('file', typeof base64 === 'string' ? base64ToFile(base64) : base64); // 将文件添加到 FormData 中
    const headers = {};
    // 使用 axios 来实现上传进度监听
    await axios
      .post('/api/admin/upload', formData, { headers: headers })
      .then((response) => {
        const responseData = response.data;
        if (responseData.code === 0) {
          Toast.success('上传成功');
          saveConfig(key, responseData?.data);
        } else {
          Toast.fail('上传失败');
        }
      })
      .catch((error) => {
        console.error('上传出错:', error);
        Toast.fail('上传出错');
      });
  };
</script>

<style lang="less" scoped>
  .tips {
    padding-left: 16px;
    margin-bottom: 10px;
    margin-top: 5px;
    font-size: 12px;
    color: gray;
  }
  .site-config {
    margin-bottom: 20px;
  }
  .config-item {
    margin-bottom: 10px;
  }
</style>
