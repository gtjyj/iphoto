export function utf16toEntities(str) {
  if (!str) return '';
  const patt = /[\ud800-\udbff][\udc00-\udfff]/g; // 检测utf16字符正则
  str = str.replace(patt, function (char) {
    let H, L, code;
    if (char.length === 2) {
      H = char.charCodeAt(0); // 取出高位
      L = char.charCodeAt(1); // 取出低位
      code = (H - 0xd800) * 0x400 + 0x10000 + L - 0xdc00; // 转换算法
      return `&#${code};`;
    }
    return char;
  });
  return str;
}

// 将字符转为表情
export function entitiesToUtf16(str) {
  const reg = /\&#.*?;/g;
  const result = str.replace(reg, function (char) {
    let H, L, code;
    if (char.length == 9) {
      code = parseInt(char.match(/[0-9]+/g));
      H = Math.floor((code - 0x10000) / 0x400) + 0xd800;
      L = ((code - 0x10000) % 0x400) + 0xdc00;
      return unescape(`%u${H.toString(16)}%u${L.toString(16)}`);
    }
    return char;
  });
  return result;
}
export function getLocalTime(nS) {
  const dt = new Date(parseInt(nS) * 1000).toLocaleString();
  return dt.replace(/:\d{1,2}$/, ' ');
}
export function formatDatetime(timespan) {
  const time = Number(timespan);
  const now = Math.round(Date.now() / 1000);
  if (now - time < 10) {
    return '几秒前';
  } else if (now - time < 60) {
    return `${now - time} 秒前`;
  } else if (now - time < 60 * 60) {
    return `${Math.floor((now - time) / 60)} 分钟前`;
  } else if (now - time < 60 * 60 * 24) {
    return `${Math.floor((now - time) / 60 / 60)} 小前`;
  } else if (now - time < 60 * 60 * 24 * 3) {
    return `${Math.floor((now - time) / 60 / 60 / 24)} 天前`;
  }
  return getLocalTime(timespan);
}
function getDaysBetween(startDate, enDate) {
  const sDate = Date.parse(startDate);
  // const eDate = Date.parse(enDate)
  // if (sDate > eDate) return 0    //开始日期大于结束日期，返回0
  // if (sDate === eDate) return 1  //如果日期相同 返回一天
  return Math.ceil((enDate - sDate) / (1 * 24 * 60 * 60 * 1000));
}
export function getIntervalDay(timespan) {
  return getDaysBetween('2022-05-28', new Date((Number(timespan) + 60 * 60 * 8) * 1000));
}

export function guid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0,
      v = c == 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export const getPicSize = (base64) => {
  return new Promise((resolve, reject) => {
    const newImage = new Image();
    newImage.src = base64;
    newImage.setAttribute('crossOrigin', 'Anonymous'); // url为外域时需要
    newImage.onload = function () {
      const imgWidth = this.width;
      const imgHeight = this.height;
      resolve({
        width: imgWidth,
        height: imgHeight,
        direction: imgWidth > imgHeight ? '1' : '2', // 1横图，2纵图
        maxSize: imgWidth > imgHeight ? imgWidth : imgHeight
      });
    };
  });
};

export const dataURLtoBlob = function (dataurl) {
  const arr = dataurl.split(',');
  const mime = arr[0].match(/:(.*?);/)[1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
};

export const queryURLParams = (url = window.location.href) => {
  const pattern = /(\w+)=(\w+)/gi; // 定义正则表达式
  const parames = {}; // 定义参数对象
  url.replace(pattern, ($, $1, $2) => {
    parames[$1] = $2;
  });
  return parames;
};

export function getClientWidth() {
  return window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
}

// 浏览器窗口的高度，兼容 Internet Explorer 8, 7, 6, 5
export function getClientHeight() {
  return window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;
}
