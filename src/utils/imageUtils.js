export const getBgRemovedUrl = (url) => {
  if (!url) return url;
  // Agar url Cloudinary ga tegishli bo'lsa va hali background removal qo'shilmagan bo'lsa
  if (url.includes('res.cloudinary.com') && !url.includes('e_background_removal')) {
    return url.replace('/upload/', '/upload/e_background_removal/');
  }
  return url;
};
