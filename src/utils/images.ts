// 图片列表（模块加载时获取）
const imagesContext = require.context(
  "../assets/images",
  false,
  /\.(jpg|jpeg|png|webp)$/,
);
const imageList = imagesContext.keys().map((key: string) => imagesContext(key));

// 封面图片（优先使用 cover.jpg，否则使用第一张图）
const coverImage =
  imageList.find(
    (img: string) => img.includes("cover") || img.endsWith("/cover.jpg"),
  ) || (imageList.length > 0 ? imageList[0] : null);

export { coverImage };
export default imageList;
