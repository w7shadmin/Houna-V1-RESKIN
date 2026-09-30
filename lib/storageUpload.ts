import { supabase } from './supabase';

/**
 * Uploads a local file (picked via expo-image-picker) to a Supabase Storage
 * bucket and returns its public URL. Shared by anything that uploads a
 * user-picked image (today the avatar upload, app/account/profile.tsx).
 */
/** The image types the buckets accept (they refuse anything else server-side too). */
const IMAGE_TYPES: Record<string, string> = {
  jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp', heic: 'image/heic', heif: 'image/heif',
};

/** A safe file extension for a picked image: one of the image types, else jpg. */
export function imageExtension(uri: string, mimeType?: string | null): string {
  const fromUri = uri.split('?')[0].split('.').pop()?.toLowerCase() ?? '';
  if (IMAGE_TYPES[fromUri]) return fromUri;
  const fromMime = Object.entries(IMAGE_TYPES).find(([, m]) => m === mimeType)?.[0];
  return fromMime ?? 'jpg';
}

export async function uploadToBucket(
  bucket: string,
  path: string,
  uri: string,
  mimeType: string | null,
): Promise<string> {
  const ext = path.split('.').pop()?.toLowerCase() ?? '';
  const contentType = IMAGE_TYPES[ext];
  if (!contentType) throw new Error('not_an_image');
  const response = await fetch(uri);
  const arrayBuffer = await response.arrayBuffer();

  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, arrayBuffer, { contentType: mimeType && Object.values(IMAGE_TYPES).includes(mimeType) ? mimeType : contentType, upsert: true });
  if (error) throw error;

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}
