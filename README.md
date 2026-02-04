# Remotion Video Project

## 项目结构

```
src/
├── assets/              # 素材资源目录
│   ├── images/          # 图片素材
│   │   └── *.jpg/png/webp
│   ├── audio/           # 音频素材
│   │   └── *.wav/mp3
│   ├── final_audio.wav  # 视频主音频
│   └── cover.jpg        # 封面图片
├── components/          # 公共组件
│   ├── ContentLayer.tsx   # 内容层（字幕+声波）
│   ├── ImageBackground.tsx # 背景图片切换
│   ├── AudioWaveform.tsx  # 声波效果
│   └── ScrollingSubtitle.tsx # 滚动字幕
├── CarouselVideo.tsx   # 轮播背景 + 字幕组件
├── CoverVideo.tsx       # 封面图片 + 字幕组件
├── Root.tsx             # 入口配置
├── images.ts            # 图片列表导出
├── utils/               # 工具函数
│   └── ease.ts          # 缓动函数
├── index.tsx
└── vite-env.d.ts        # 类型声明
```

## 开发规范

### 素材存放

- **图片**: 放在 `src/assets/images/` 目录
- **封面**: 放在 `src/assets/cover.jpg`
- **音频**: 放在 `src/assets/` 目录
- 外部素材可通过软链接引入，或复制到 assets 目录

### 资源加载

```tsx
// 图片列表：使用 images.ts 导出
import { imageList } from "./images";

// 或手动加载
const imagesContext = require.context(
  "./assets/images",
  false,
  /\.(jpg|jpeg|png|webp)$/
);
const imageList = imagesContext.keys().map((key) => imagesContext(key));
```

### 组件使用

在 `Root.tsx` 中切换视频类型：
```typescript
const CURRENT_VIDEO: VideoType = "carousel";  // 轮播背景
// 或
const CURRENT_VIDEO: VideoType = "cover";     // 封面图片
```

## Commands

```bash
# 安装依赖
npm i

# 启动预览
npm run dev

# 渲染视频
npx remotion render src/index.tsx CarouselVideo output.mp4
npx remotion render src/index.tsx CoverVideo output.mp4
```
