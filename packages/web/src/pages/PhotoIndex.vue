<template>
  <div class="page-root">
    <div class="container" v-if="!noInit">
      <van-list v-model:loading="loading" :finished="finished" finished-text="感谢看完所有图片" @load="loadList">
        <div class="header">
          <div class="share">
            <van-icon name="share-o" @click.stop="showQRcode = true" />
            <van-overlay :show="showQRcode" @click="showQRcode = false" :custom-style="{ background: 'rgba(255,255,255,0.2)' }">
              <div class="qrcode">
                <div style="font-size: 10px">截屏保存二维码</div>
                <img :src="'/api/photos/qrcode'" />
                <div>
                  <div style="font-weight: 600; color: #00615f">按住识别二维码</div>
                  <div style="color: #002928; font-size: 14px; margin-top: 5px">或访问 {__VAR_domain__}</div>
                  <br />
                </div>
              </div>
            </van-overlay>
          </div>
          <div class="header-image"></div>
          <div class="avatar"></div>
          <div class="title2">{__VAR_nick__}</div>
          <div class="title">
            {__VAR_desc__}
            <div class="total"><van-icon name="photo-o" /> 共 {{ total }} 张</div>
            <div class="viewcount" v-if="count > 0"><van-icon name="eye-o" /> {{ count + 1 }}</div>
          </div>
          <div style="width: 100%; height: 10px; background: #f0f0f0; margin-top: 5px"></div>
          <div style="height: 8px; width: 100%; background: white"></div>
        </div>
        <div class="pc-photo-container" v-if="width >= 800">
          <div v-for="(cols, idx) in colList" :key="idx" ref="colRef">
            <div class="photos" :style="{ display: index % colList.length === idx ? 'block' : 'none' }" v-for="(item, index) in photoList" :key="index">
              <template v-if="index % colList.length === idx">
                <van-image
                  style="border-radius: 10px; overflow: hidden"
                  :width="item.width"
                  :height="item.height"
                  fit="cover"
                  lazy-load
                  @click="onPreview(index)"
                  :src="item.thumb"
                >
                  <template v-slot:loading>
                    <van-loading type="spinner" size="20" />
                  </template>
                </van-image>
              </template>
            </div>
          </div>
        </div>
        <div class="mobile-photo-container" v-if="width < 800">
          <div class="photos" v-for="(item, index) in photoList" :key="index">
            <van-image :width="item.width" :height="item.height" fit="cover" lazy-load @click="onPreview(index)" :src="item.thumb">
              <template v-slot:loading>
                <van-loading type="spinner" size="20" />
              </template>
            </van-image>
            <div v-if="false" class="love-btn" @click="onLove(item)">
              <van-icon v-if="!item.isLove" name="like-o" />
              <van-icon v-else name="like" style="color: #eb0027" />
              <span v-if="item.love" style="font-size: 18px; margin-left: 5px; padding-bottom: 5px">{{ item.love > 999 ? '999+' : item.love }}</span>
            </div>
          </div>
        </div>
      </van-list>
    </div>
    <div v-if="noInit">您还没有配置站点名称，请前往/admin页面配置, 配置名称、应用配置，如果是本地调试web中，请重新启动web服务</div>
    <div class="over-text" v-if="showOverText">点击任意位置关闭，双指可放大图片</div>
  </div>
</template>
<script setup>
  import { computed, onMounted, ref } from 'vue';
  import { ImagePreview } from 'vant';
  import { getClientWidth } from '../libs/utils';
  import axios from 'axios';
  import { cloneDeep } from 'lodash-es';
  const noInit = ref('{__VAR_siteName__}'.includes('__VAR_siteName__'));
  const photoList = ref([]);
  const cols = ref(4);
  const colList = ref([]);
  const loading = ref(false);
  const finished = ref(false);
  const showOverText = ref(false);
  const showQRcode = ref(false);
  const width = ref(0);
  const count = ref(0);
  const total = ref(0);
  const colRef = ref([]);

  onMounted(() => {
    width.value = getClientWidth();
    Array.from({ length: cols.value }).map(() => {
      colList.value.push([]);
    });
    // if (width.value > 900) width.value = 900;
  });

  let page = 0;
  const limit = 20;
  const loadList = () => {
    page += 1;
    loading.value = true;
    axios
      .post('/api/photos/items', {
        page,
        limit
      })
      .then((result) => {
        if (result.data.code === 0) {
          const { list, total: totalCount } = result.data.data;
          total.value = totalCount;
          loading.value = false;
          let handedList = [];
          if (width.value >= 800) {
            handedList = pcView(list);
          } else {
            handedList = mobileView(list);
          }

          const toShow = handedList.map((o) => {
            o.thumb = o.cos ? o.cos : `/api/photos/image/${o.fileKey}`;
            o.hd = o.cosHD ? o.cosHD : `/api/photos/hd/${o.fileKey}`;
            return o;
          });
          photoList.value = photoList.value.concat(toShow);

          // if (width.value >= 800) {
          //   toShow.forEach((item, index) => {
          //     console.log(colRef.value[0].clientHeight);
          //     const colIndex = index % cols.value;
          //     colList.value[colIndex].push(item);
          //   });
          // }

          if (totalCount.value === 0 || list.length < limit) {
            finished.value = true;
          }
        } else {
          finished.value = true;
        }
      });
  };

  const mobileView = (list) => {
    const copyList = cloneDeep(list);
    if (copyList.length) {
      for (let i = 0; i < copyList.length; i) {
        const item = copyList[i];
        const next = copyList[i + 1];

        if (!next) {
          setOne(item); // 没有后面
          i += 1;
        } else if (next.direction !== item.direction) {
          // curr和next方向不一样
          setTwo(item);
          setTwo(next);
          i = i + 2;
        } else {
          // 方向一样
          if (item.direction === '2' && next.direction === '2') {
            setVerticalTwo(item);
            setVerticalTwo(next);
            i = i + 2;
          } else {
            setOne(item);
            i = i + 1;
          }
        }
      }
    }
    return copyList;
  };

  const pcView = (list) => {
    const copyList = cloneDeep(list);
    if (copyList.length) {
      for (let i = 0; i < copyList.length; i += 1) {
        const curr = copyList[i];
        curr.width = '100%';
        if (curr.direction === '2') {
          curr.height = calcedWidth.value * 1.37;
        } else {
          curr.height = (calcedWidth.value / 3) * 2;
        }
      }
    }
    return copyList;
  };

  const calcedWidth = computed(() => {
    return width.value >= 800 ? width.value / cols.value : width.value;
    // return width.value;
  });

  const setOne = (curr) => {
    curr.width = calcedWidth.value - 14;
    if (curr.direction === '2') {
      curr.height = calcedWidth.value * 1.5;
    } else {
      curr.height = (calcedWidth.value / 3) * 2;
    }
  };
  const setTwo = (curr) => {
    if (curr.direction === '1') {
      // 水平
      curr.width = (calcedWidth.value / 3) * 2 - 12;
    } else {
      curr.width = calcedWidth.value / 3 - 12;
    }
    curr.height = calcedWidth.value / 2.4;
  };
  const setVerticalTwo = (curr) => {
    curr.width = calcedWidth.value / 2 - 12;
    curr.height = (calcedWidth.value / 3) * 2;
  };
  const onPreview = (idx) => {
    showOverText.value = true;
    ImagePreview({
      images: [photoList.value[idx].hd],
      // startPosition: idx,
      closeable: true,
      teleport: 'body',
      showIndex: false,
      overlayStyle: {},
      onClose() {
        showOverText.value = false;
      }
    });
  };
</script>

<style lang="less" scoped>
  body {
    padding: 0;
    margin: 0;
    overflow-x: hidden;
    overflow-y: hidden;
  }
  .page-root {
    background-color: rgb(240, 240, 240);
    width: 100%;
    text-align: center;
  }
  .container {
    background: white;
    /* max-width: 900px; */
    width: 100%;
    display: inline-block;
  }
  .mobile-photo-container {
    width: 100%;
    box-sizing: border-box;
  }
  .pc-photo-container {
    width: 100%;
    display: flex;
    justify-content: space-between;
    padding: 0 10px;
    gap: 10px;
    box-sizing: border-box;
    > div {
      display: flex;
      flex-wrap: wrap;
      width: 25%;
      flex-direction: column;
      gap: 10px;
      > div {
        width: 100%;
      }
    }
  }
  .photos {
    position: relative;
    display: inline-block;
    justify-content: space-between;
  }
  @media (max-width: 799px) {
    .photos {
      margin: 0 3px 3px;
    }
  }
  @media (min-width: 800px) {
    .photos {
      margin: 0;
      border-radius: 10px;
      overflow: hidden;
    }
  }
  .header {
    position: relative;
  }
  .title {
    height: 40px;
    width: 100%;
    padding-top: 0px;
    position: relative;
    font-family: fangsong;
    box-sizing: border-box;
    color: #014a4a;
  }
  .avatar {
    position: absolute;
    top: 70px;
    left: 50%;
    height: 70px;
    width: 70px;
    transform: translateX(-50%) translateY(-50%);
    border-radius: 100%;
    border: 2px solid #b0b0b0;
    background-size: cover;
    background-position: center center;
    background-image: url(/{__VAR_avatar__});
  }
  .title2 {
    position: absolute;
    top: 110px;
    width: 100%;
    color: #002525;
    font-family: 'fangsong';
    text-align: center;
  }
  .header-image {
    height: 160px;
    width: 100%;
    /* filter: blur(5px); */
    position: relative;
    background-size: cover;
    background-position: center center;
    background-repeat: no-repeat;
    background-image: linear-gradient(to top, rgba(255, 255, 255, 1), rgba(255, 255, 255, 0), rgba(255, 255, 255, 0)), url(/{__VAR_header__});
  }
  .title > .viewcount {
    position: absolute;
    right: 10px;
    bottom: -3px;
    font-size: 10px;
  }

  .title > .total {
    position: absolute;
    left: 10px;
    bottom: -3px;
    font-size: 10px;
  }
  .photos > div {
    margin: 0px;
  }
  .share {
    position: absolute;
    right: 5px;
    top: 5px;
    width: 20px;
    height: 20px;
  }
  .share > i {
    font-size: 20px;
    color: rgb(216, 216, 216);
    z-index: 1;
  }
  .qrcode {
    padding: 10px 0;
    width: 250px;
    height: 260px;
    position: absolute;
    border-radius: 5px;
    top: 230px;
    left: 50%;
    opacity: 0.95;
    background: white;
    transform: translateX(-50%);
  }
  .qrcode img {
    width: 180px;
    height: 180px;
  }
  .love-btn {
    position: absolute;
    right: 10px;
    bottom: 5px;
    color: white;
    font-size: 22px;
    min-width: 50px;
    height: 50px;
    line-height: 60px;
  }
  .over-text {
    pointer-events: none;
    position: fixed;
    width: 100%;
    top: 10px;
    text-align: center;
    color: #e6e6e6;
    z-index: 100000;
  }
</style>
