// .srt 字幕文件模块声明（webpack asset/source 导出 raw 字符串）
declare module "*.srt" {
  const content: string;
  export default content;
}
