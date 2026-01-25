# Remotion Video Project

## 项目结构

```
src/
├── assets/              # 素材资源目录
│   ├── images/          # 图片素材
│   │   └── *.jpg/png/webp
│   ├── audio/           # 音频素材
│   │   └── *.wav/mp3
│   └── final_audio.wav  # 视频主音频
├── components/          # 组件
├── Composition.tsx      # 图片轮播组件
├── DialogueVideo.tsx    # 对话视频组件
├── Root.tsx             # 入口配置
├── index.tsx
└── vite-env.d.ts        # 类型声明
```

## 开发规范

### 素材存放

- **图片**: 放在 `src/assets/images/` 目录
- **音频**: 放在 `src/assets/` 目录
- 外部素材可通过软链接引入，或复制到 assets 目录

### 资源加载

```tsx
// 图片：使用 require.context
const imagesContext = require.context(
  "./assets/images",
  false,
  /\.(jpg|jpeg|png|webp)$/
);
const imageList = imagesContext.keys().map((key) => imagesContext(key));

// 音频：使用 require
<Audio src={require("./assets/audio.wav")} volume={1} />
```

### 组件命名

- 对话视频组件: `DialogueVideo.tsx`
- 图片轮播组件: `Composition.tsx`
- 组合配置: `Root.tsx`

## Commands

```bash
# 安装依赖
npm i

# 启动预览
npm run dev

# 渲染视频
npx remotion render src/index.tsx DialogueVideo output.mp4
npx remotion render src/index.tsx MyComp output.mp4

# 升级 Remotion
npx remotion upgrade
```
