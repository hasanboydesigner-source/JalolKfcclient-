export const getBgRemovedUrl = (url) => {
  if (!url) return url;
  if (url.includes('res.cloudinary.com') && !url.includes('e_background_removal')) {
    // f_auto - shaffoflikni qo'llab-quvvatlaydigan formatni (masalan PNG) majburlaydi
    return url.replace('/upload/', '/upload/e_background_removal,f_auto,q_auto/');
  }
  return url;
};
