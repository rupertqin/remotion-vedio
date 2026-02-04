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
│   └── cover.jpg        # 封面图片（可选）
├── components/          # 公共组件
│   ├── ContentLayer.tsx    # 内容层（字幕+声波）
│   ├── ImageBackground.tsx # 背景图片切换
│   ├── AudioWaveform.tsx   # 声波效果
│   └── ScrollingSubtitle.tsx # 滚动字幕
├── CarouselVideo.tsx    # 轮播背景 + 字幕组件
├── CoverVideo.tsx       # 封面图片 + 字幕组件
├── Root.tsx             # 入口配置
├── config.ts            # 尺寸配置
├── utils/               # 工具函数
│   ├── images.ts         # 图片列表导出
│   └── ease.ts          # 缓动函数
├── index.tsx
└── vite-env.d.ts        # 类型声明
```

## 开发规范

### 素材存放

- **图片**: 放在 `src/assets/images/` 目录
- **封面**: 放在 `src/assets/cover.jpg`（可选，没有则使用第一张图片）
- **音频**: 放在 `src/assets/` 目录

### 资源加载

```tsx
import imageList, { coverImage } from "./utils/images";
// imageList: assets/images/ 目录下所有图片
// coverImage: cover.jpg（存在时）或第一张图片
```

### 尺寸配置

在 `src/config.ts` 中定义尺寸预设：

```typescript
export const VIDEO_CONFIG = {
  PORTRAIT_720P: { width: 720, height: 1280 },
  PORTRAIT_1080P: { width: 1080, height: 1920 },
  HD_720P: { width: 1280, height: 720 },
  FULL_HD_1080P: { width: 1920, height: 1080 },
};
```

在 `src/Root.tsx` 中为各组件配置不同尺寸：

```typescript
const CAROUSEL_CONFIG = VIDEO_CONFIG.HD_720P;      // 轮播组件尺寸
const COVER_CONFIG = VIDEO_CONFIG.PORTRAIT_720P;   // 封面组件尺寸
```

组件内部通过 `useVideoConfig()` 自动获取实际尺寸，并自动计算横竖屏适配。

## Commands

```bash
# 安装依赖
npm i

# 启动预览
npm run dev

# 渲染视频
npx remotion render src/index.tsx CarouselVideo output.mp4
npx remotion render src/index.tsx CoverVideo output.mp4

# 升级 Remotion
npx remotion upgrade
```
