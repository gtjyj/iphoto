import axios from 'axios';

export class ConfigFetcher {
  static instance = null;
  static getInstance() {
    if (!this.instance) {
      this.instance = new ConfigFetcher();
    }
    return this.instance;
  }
  constructor() {
    if (ConfigFetcher.instance) {
      throw new Error('单例模式，只能有一个实例');
    }
    this.configData = null;
    this.promise = null;
  }
  async getAllConfigs() {
    if (this.configData) {
      return Promise.resolve(this.configData);
    }
    if (!this.promise) {
      this.promise = new Promise((resolve, reject) => {
        axios
          .post('/api/photos/siteConfig')
          .then((res) => {
            resolve(res.data.data);
          })
          .catch((error) => {
            this.promise = null;
            reject(error);
          });
      });
    }
    return this.promise;
  }
}
