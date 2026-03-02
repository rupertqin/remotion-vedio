export {};

declare global {
  const require: {
    context(
      directory: string,
      useSubdirectories?: boolean,
      regExp?: RegExp
    ): {
      (id: string): string;
      keys(): string[];
      <T>(id: string): T;
      resolve(id: string): string;
      id: string;
    };
  };
}

// 允许导入 .srt 字幕文件（webpack asset/source，导出 raw 字符串）
declare module "*.srt" {
  const content: string;
  export default content;
}
