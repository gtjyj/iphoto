const dealImage = (base64, w, callback) => {
  const newImage = new Image();
  let quality = 0.6; // 压缩系数0-1之间
  newImage.src = base64;
  newImage.setAttribute('crossOrigin', 'Anonymous'); // url为外域时需要
  let imgWidth, imgHeight;
  newImage.onload = function () {
    imgWidth = this.width;
    imgHeight = this.height;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (Math.max(imgWidth, imgHeight) > w) {
      if (imgWidth > imgHeight) {
        canvas.width = w;
        canvas.height = (w * imgHeight) / imgWidth;
      } else {
        canvas.height = w;
        canvas.width = (w * imgWidth) / imgHeight;
      }
    } else {
      canvas.width = imgWidth;
      canvas.height = imgHeight;
      quality = 0.6;
    }
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(this, 0, 0, canvas.width, canvas.height);
    let base64 = canvas.toDataURL('image/jpeg', quality); // 压缩语句
    // 如想确保图片压缩到自己想要的尺寸,如要求在100kb以下，请加以下语句，quality初始值根据情况自定
    while (base64.length / 1024 > 100) {
      quality -= 0.01;
      base64 = canvas.toDataURL('image/jpeg', quality);
    }
    callback(base64); // 必须通过回调函数返回，否则无法及时拿到该值
  };
};

export default dealImage;
