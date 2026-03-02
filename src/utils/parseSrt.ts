// SRT 字幕解析工具

export interface SrtSegment {
  index: number;
  text: string;
  start_time: number; // 秒
  end_time: number; // 秒
  duration: number; // 秒
}

export interface SrtData {
  segments: SrtSegment[];
  total_duration: number;
}

// 将 SRT 时间戳 (HH:MM:SS,mmm) 转为秒
const parseTimestamp = (ts: string): number => {
  const parts = ts.split(":");
  const hours = parseInt(parts[0], 10) || 0;
  const minutes = parseInt(parts[1], 10) || 0;
  const secondsWithMs = parts[2] || "0";
  const [seconds, ms] = secondsWithMs.replace(",", ".").split(".");
  return (
    hours * 3600 +
    minutes * 60 +
    parseInt(seconds, 10) +
    (parseInt(ms || "0", 10) / 1000)
  );
};

// 解析 SRT 文本内容
export const parseSrt = (srtContent: string): SrtData => {
  const blocks = srtContent
    .replace(/\r\n/g, "\n")
    .trim()
    .split(/\n\s*\n/);

  const segments: SrtSegment[] = [];

  for (const block of blocks) {
    const lines = block.split("\n").map((l) => l.trim()).filter(Boolean);
    if (lines.length < 2) continue;

    // 跳过序号行（如果存在）
    let timeLineIndex = 0;
    if (/^\d+$/.test(lines[0])) {
      timeLineIndex = 1;
    }

    const timeLine = lines[timeLineIndex];
    const match = timeLine.match(
      /(\d{1,2}:\d{2}:\d{2}[,.]\d{3})\s*-->\s*(\d{1,2}:\d{2}:\d{2}[,.]\d{3})/,
    );
    if (!match) continue;

    const start_time = parseTimestamp(match[1]);
    const end_time = parseTimestamp(match[2]);
    const text = lines
      .slice(timeLineIndex + 1)
      .join("\n")
      .trim();

    if (!text) continue;

    segments.push({
      index: segments.length,
      text,
      start_time,
      end_time,
      duration: Math.max(end_time - start_time, 0.1),
    });
  }

  const total_duration =
    segments.length > 0
      ? segments[segments.length - 1].end_time
      : 0;

  return { segments, total_duration };
};
