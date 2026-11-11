import { text } from '../texts.js';

const supportedImages = ['image/jpeg', 'image/png', 'image/webp'];
const maxFileSize = 2 * 1024 * 1024;

export const galleryImage = (key) => `/metas/${key}.webp`;
export const defaultGoalImage = galleryImage('frasco');

export function goalImageUrl(path, baseUrl = import.meta.env.VITE_API_URL) {
  if (typeof path !== 'string' || !path.startsWith('/')) return null;
  try {
    const origin = new URL(baseUrl, globalThis.location?.origin).origin;
    const url = new URL(path, origin);
    return url.origin === origin ? url.href : null;
  } catch {
    return null;
  }
}

export async function shrinkGoalImage(file) {
  if (file.size > maxFileSize) throw new Error(text.goalImageSize);
  if (!supportedImages.includes(file.type)) throw new Error(text.invalidGoalImage);

  let image;
  try {
    image = await createImageBitmap(file);
    const scale = Math.min(1, 800 / Math.max(image.width, image.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(image.width * scale));
    canvas.height = Math.max(1, Math.round(image.height * scale));
    canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/webp', 0.8));
    if (blob?.type !== 'image/webp') throw new Error(text.invalidGoalImage);
    return new File([blob], 'meta.webp', { type: blob.type });
  } catch {
    throw new Error(text.invalidGoalImage);
  } finally {
    image?.close();
  }
}

export function goalBody(values, image, removeImage) {
  if (!image && !removeImage) return values;
  const body = new FormData();
  for (const [key, value] of Object.entries(values)) body.set(key, value ?? '');
  if (image) body.set('image', image);
  else body.set('remove_image', 'true');
  return body;
}

export function monthlyGoalAmount(goal, today) {
  if (!goal.deadline || Number(goal.progress_percentage) >= 100) return null;
  const remaining =
    Math.round(Number(goal.target_amount) * 100) - Math.round(Number(goal.saved_amount) * 100);
  if (remaining <= 0) return null;

  const [year, month, day] = goal.deadline.split('-').map(Number);
  const [nowYear, nowMonth, nowDay] = today.split('-').map(Number);
  const months = (year - nowYear) * 12 + month - nowMonth + Number(day > nowDay);
  return Math.ceil(remaining / Math.max(1, months)) / 100;
}
