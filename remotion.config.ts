/**
 * Note: When using the Node.JS APIs, the config file
 * doesn't apply. Instead, pass options directly to the APIs.
 *
 * All configuration options: https://remotion.dev/docs/config
 */

import { Config } from "@remotion/cli/config";
import { enableTailwind } from "@remotion/tailwind-v4";

Config.setVideoImageFormat("jpeg");
Config.setOverwriteOutput(true);
Config.overrideWebpackConfig((config) => {
  config = enableTailwind(config);
  // 让 .srt 字幕文件以 raw 字符串形式导入
  config.module.rules.push({
    test: /\.srt$/,
    type: "asset/source",
  });
  return config;
});
