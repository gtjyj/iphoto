import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'path';
import { existsSync, readFileSync } from 'fs';
import Components from 'unplugin-vue-components/vite';
import AutoImport from 'unplugin-auto-import/vite';
import { VantResolver } from 'unplugin-vue-components/resolvers';
const configPath = resolve('../server/userdata/site-config.json');
let siteConfig = {};
if (existsSync(configPath)) {
  try {
    const data = readFileSync(configPath, 'utf8');
    console.log(data);
    siteConfig = JSON.parse(data);
  } catch (error) {
    console.error('Failed to parse site-config.json:', error);
  }
} else {
  console.warn('site-config.json file not found.');
}

function replaceStringPlugin() {
  return {
    name: 'replace-string',
    transform(code, id) {
      if (Object.keys(siteConfig).length) {
        if (/\.vue$|\.css$|\.js|\.less$/.test(id)) {
          Object.keys(siteConfig).forEach((key) => {
            const regex = new RegExp(`{__VAR_${key}__}`, 'g');
            code = code.replace(regex, siteConfig[key] || '');
          });
        }
      }
      return code;
    },
    transformIndexHtml(html) {
      if (Object.keys(siteConfig).length) {
        Object.keys(siteConfig).forEach((key) => {
          const regex = new RegExp(`{__VAR_${key}__}`, 'g');
          html = html.replace(regex, siteConfig[key] || '');
        });
      }
      return html;
    }
  };
}

export default defineConfig(({mode})=>{
  return {
    build: {
      outDir: '../server/html',
    },
    plugins: [
      vue({
        template: {
          transformAssetUrls: {
            img: ['src', 'data-src'],
            image: ['xlink:href', 'href']
          }
        }
      }),
      AutoImport({
        imports: ['vue']
      }),
      Components({
        resolvers: [VantResolver()]
      }),
      mode === 'development' ? replaceStringPlugin() : null
    ],
    css: {
      preprocessorOptions: {
        less: {
          javascriptEnabled: true
        }
      }
    },
    server: {
      https: false
    }
  }
});
