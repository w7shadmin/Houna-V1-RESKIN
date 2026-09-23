import { supabase } from './supabase';

/**
 * Uploads a local file (picked via expo-image-picker) to a Supabase Storage
 * bucket and returns its public URL. Shared by anything that uploads a
 * user-picked image — avatar upload (app/account/profile.tsx) and Voices
 * post photos (lib/voices.ts) both do this identical sequence.
 */
export async function uploadToBucket(
  bucket: string,
  path: string,
  uri: string,
  mimeType: string | null,
): Promise<string> {
  const response = await fetch(uri);
  const arrayBuffer = await response.arrayBuffer();

  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, arrayBuffer, { contentType: mimeType ?? 'image/jpeg', upsert: true });
  if (error) throw error;

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}
