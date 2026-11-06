/** One local photograph selection for cards, details and bag thumbnails. */
export function productPhotoSources(id, presentation = {}) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id)) return null;
  const original = `./images/menu/${id}.webp`;
  const campaign = presentation.campaign_photos?.[id];
  const width = presentation.campaign_photo_widths?.[id];
  if (typeof campaign !== 'string' || !/^\.\/images\/campaign\/[a-z0-9-]+\.webp$/.test(campaign)
    || !Number.isInteger(width) || width < 640) {
    return {src:original, thumbnail:original, srcset:'', original};
  }
  const thumbnail = campaign.replace(/\.webp$/,'-640.webp');
  return {src:campaign, thumbnail, srcset:`${thumbnail} 640w, ${campaign} ${width}w`, original};
}
