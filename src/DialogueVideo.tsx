import { AbsoluteFill, useVideoConfig, Audio } from "remotion";
import { useCurrentFrame } from "remotion";
import { useMemo } from "react";
import audioFile from "./assets/final_audio.wav";

// 加载图片
const imagesContext = require.context(
  "./assets/images",
  false,
  /\.(jpg|jpeg|png|webp)$/,
);

interface Segment {
  index: number;
  voice: string;
  text: string;
  start_time: number;
  end_time: number;
  duration: number;
  audio_file: string;
}

interface Metadata {
  source_file: string;
  output_audio: string;
  total_duration: number;
  segment_count: number;
  created_at: string;
  model: string;
  segments: Segment[];
}

const metadata: Metadata = {
  source_file: "speech.txt",
  output_audio: "assets/final_audio.wav",
  total_duration: 175.976,
  segment_count: 23,
  created_at: "2026-01-26T01:26:10.734589",
  model: "F5TTS_v1_Base",
  segments: [
    {
      index: 0,
      voice: "vivian.surprise",
      text: "张晓晶说金融强国要先搞思想启蒙，英国工业革命和日本明治维新都是先解放思想才实现崛起的。",
      start_time: 0.0,
      end_time: 8.555,
      duration: 8.555,
      audio_file: "vivian.surprise_c388d8.wav",
    },
    {
      index: 1,
      voice: "vivian.surprise",
      text: '我们现在还抱着"金融原罪论"，说金融是虚的、乱的，这观念太落伍了！',
      start_time: 8.555,
      end_time: 14.892,
      duration: 6.337,
      audio_file: "vivian.surprise_92e000.wav",
    },
    {
      index: 2,
      voice: "man.surprise",
      text: "金融启蒙？2008年金融危机就是金融过度创新的恶果。马克思早就指出金融资本会放大资本主义基本矛盾。",
      start_time: 14.892,
      end_time: 29.634,
      duration: 14.742,
      audio_file: "man.surprise_2008.wav",
    },
    {
      index: 3,
      voice: "vivian.surprise",
      text: "你这是片面理解！现代金融的核心是信用创造。",
      start_time: 29.634,
      end_time: 33.88,
      duration: 4.246,
      audio_file: "vivian.surprise_447ab7.wav",
    },
    {
      index: 4,
      voice: "vivian.surprise",
      text: '约翰·劳的纸币理论、熊彼特的信贷创新理论都证明，金融能够通过信用"无中生有"地动员资源。',
      start_time: 33.88,
      end_time: 42.297,
      duration: 8.417,
      audio_file: "vivian.surprise_1680a4.wav",
    },
    {
      index: 5,
      voice: "vivian.surprise",
      text: "英国的国债制度就是最好的例子！",
      start_time: 42.297,
      end_time: 45.37,
      duration: 3.073,
      audio_file: "vivian.surprise_1285b2.wav",
    },
    {
      index: 6,
      voice: "man.surprise",
      text: "信用创造？那为什么每次科技创新都伴随着泡沫和危机？金融投机和泡沫就像影子一样跟着科技创新。",
      start_time: 45.37,
      end_time: 56.208,
      duration: 10.838,
      audio_file: "man.surprise_c9c32c.wav",
    },
    {
      index: 7,
      voice: "vivian.surprise",
      text: '所以要正确看待风险！马斯克的"快速失败法"就很有启发——失败是数据，不是灾难。',
      start_time: 56.208,
      end_time: 63.718,
      duration: 7.51,
      audio_file: "vivian.surprise_c172e0.wav",
    },
    {
      index: 8,
      voice: "vivian.surprise",
      text: '美国之所以能保持科技领先，就是因为他们建立了"先创新、后治理"的机制，容忍失败，鼓励冒险。',
      start_time: 63.718,
      end_time: 72.401,
      duration: 8.683,
      audio_file: "vivian.surprise_528ee5.wav",
    },
    {
      index: 9,
      voice: "man.surprise",
      text: "中国能照搬美国模式吗？美国靠美元霸权可以把风险转嫁给全球，我们只能守住不发生系统性风险的底线。",
      start_time: 72.401,
      end_time: 86.685,
      duration: 14.284,
      audio_file: "man.surprise_66ac39.wav",
    },
    {
      index: 10,
      voice: "vivian.surprise",
      text: "但现在是数字金融下半场的关键时期！",
      start_time: 86.685,
      end_time: 90.142,
      duration: 3.457,
      audio_file: "vivian.surprise_ec4e8a.wav",
    },
    {
      index: 11,
      voice: "vivian.surprise",
      text: "加密资产总市值已经达到全球黄金储备的84%，比特币涨到12万美元，美国正在构建数字版布雷顿森林体系。",
      start_time: 90.142,
      end_time: 99.412,
      duration: 9.27,
      audio_file: "vivian.surprise_8412.wav",
    },
    {
      index: 12,
      voice: "vivian.surprise",
      text: "我们再保守就要错过整个时代了！",
      start_time: 99.412,
      end_time: 102.485,
      duration: 3.073,
      audio_file: "vivian.surprise_c6bf19.wav",
    },
    {
      index: 13,
      voice: "man.surprise",
      text: "虚拟货币在中国是明确禁止的！稳定币会削弱货币政策有效性，这是红线。金融安全永远是第一位的。",
      start_time: 102.485,
      end_time: 111.905,
      duration: 9.42,
      audio_file: "man.surprise_0e86e2.wav",
    },
    {
      index: 14,
      voice: "vivian.surprise",
      text: "IMF总裁都说了，加密货币浪潮挡不住。",
      start_time: 111.905,
      end_time: 115.362,
      duration: 3.457,
      audio_file: "vivian.surprise_imf.wav",
    },
    {
      index: 15,
      voice: "vivian.surprise",
      text: "我们要预留接口，审慎发展数字资产。",
      start_time: 115.362,
      end_time: 118.819,
      duration: 3.457,
      audio_file: "vivian.surprise_88c733.wav",
    },
    {
      index: 16,
      voice: "vivian.surprise",
      text: '张晓晶提出的"六个强大"中，强大的金融机构和国际金融中心建设都需要拥抱创新！',
      start_time: 118.819,
      end_time: 126.126,
      duration: 7.307,
      audio_file: "vivian.surprise_08b456.wav",
    },
    {
      index: 17,
      voice: "man.surprise",
      text: '创新必须在监管框架内进行。"六大体系"建设首先要完善金融监管，这是中央明确的要求。',
      start_time: 126.126,
      end_time: 136.282,
      duration: 10.156,
      audio_file: "man.surprise_f49898.wav",
    },
    {
      index: 18,
      voice: "vivian.surprise",
      text: '所以要平衡"道"和"器"！',
      start_time: 136.282,
      end_time: 138.437,
      duration: 2.155,
      audio_file: "vivian.surprise_51603a.wav",
    },
    {
      index: 19,
      voice: "vivian.surprise",
      text: '金融启蒙是"道"，战略部署是"器"。既要解放思想，又要稳妥推进。',
      start_time: 138.437,
      end_time: 144.315,
      duration: 5.878,
      audio_file: "vivian.surprise_0fdf42.wav",
    },
    {
      index: 20,
      voice: "man.surprise",
      text: "我同意推进金融强国建设，但必须坚持中国特色。在中美科技竞争的背景下，我们要走自己的路。",
      start_time: 144.315,
      end_time: 155.761,
      duration: 11.446,
      audio_file: "man.surprise_ddd991.wav",
    },
    {
      index: 21,
      voice: "vivian.surprise",
      text: "未来五年是关键期，我们要敢于运用自己的理性，既批判吸收国际经验，又突出自主发展。",
      start_time: 155.761,
      end_time: 165.49,
      duration: 9.729,
      audio_file: "vivian.surprise_9252c0.wav",
    },
    {
      index: 22,
      voice: "man.surprise",
      text: "关键是要把握好度，既不能因循守旧，也不能盲目冒进。中国特色金融发展之路，就是要稳中求进。",
      start_time: 165.49,
      end_time: 175.976,
      duration: 10.486,
      audio_file: "man.surprise_7ff25a.wav",
    },
  ],
};

// 说话者配置
const SPEAKERS: Record<string, { name: string; color: string }> = {
  "vivian.surprise": { name: "Vivian", color: "#ffffff" },
  "man.surprise": { name: "Mr. Zhang", color: "#ffffff" },
};

// 图片背景组件
const ImageBackground = ({
  imageIndex,
  frame,
}: {
  imageIndex: number;
  frame: number;
}) => {
  const imageList = useMemo(() => {
    return imagesContext.keys().map((key: string) => imagesContext(key));
  }, []);

  const currentImage = imageList[imageIndex % imageList.length];

  // 轻微的缩放动画
  const scale = 1 + Math.sin(frame * 0.01) * 0.02;

  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        overflow: "hidden",
      }}
    >
      <img
        src={currentImage}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          transform: `scale(${scale})`,
        }}
      />
      {/* 遮罩层 */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0,0,0,0.5)",
        }}
      />
    </div>
  );
};

export const DialogueVideo = () => {
  const { fps, width } = useVideoConfig();
  const frame = useCurrentFrame();
  const currentTime = frame / fps;

  // 当前时间段
  const currentSegment = metadata.segments.find(
    (seg) => currentTime >= seg.start_time && currentTime < seg.end_time,
  );

  const speaker = currentSegment?.voice || "vivian.surprise";
  const speakerConfig = SPEAKERS[speaker];
  const segmentIndex = currentSegment?.index || 0;

  return (
    <AbsoluteFill style={{ backgroundColor: "#1a1a2e" }}>
      {/* 背景图片 */}
      <ImageBackground imageIndex={segmentIndex} frame={frame} />

      {/* 主音频 */}
      <Audio src={audioFile} volume={1} />

      {/* 内容层 */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          padding: 60,
        }}
      >
        {/* 对话内容 */}
        <div
          style={{
            fontSize: 36,
            color: speakerConfig.color,
            textAlign: "center",
            maxWidth: width - 120,
            lineHeight: 1.6,
            fontWeight: "500",
            textShadow: "2px 2px 10px rgba(0,0,0,0.5)",
          }}
        >
          {currentSegment?.text || ""}
        </div>
      </div>
    </AbsoluteFill>
  );
};
