import { supabase } from './supabase';
import { imageExtension, uploadToBucket } from './storageUpload';
import { activityActor } from './activityActor';

export type VoicePostStatus = 'pending' | 'approved' | 'rejected';

export interface VoicePost {
  id: string;
  /** Only on the person's own posts (fetchMyPosts); the feed never says whose a post is. */
  user_id?: string;
  /** From get_voice_post: whether it's the caller's own. */
  is_mine?: boolean;
  title: string | null;
  body: string | null;
  image_url: string | null;
  for_meditation: boolean;
  status: VoicePostStatus;
  created_at: string;
  /** Only present when the row came from a query that joined `profiles` (the public feed) — a caller's own posts don't need it since it's always their own username. */
  username?: string;
}

/**
 * Both reads below go through a `SECURITY DEFINER` RPC rather than a
 * PostgREST embedded join (`profiles(username)`) — `profiles` RLS only
 * allows reading your own row, so a plain join silently returns a null
 * username for every post that isn't the viewer's own. The RPC returns
 * just the username, nothing else from `profiles`, for approved posts (or
 * the caller's own row regardless of status).
 */
export async function fetchApprovedPosts(): Promise<VoicePost[]> {
  // Less what this phone blocked or reported (keyed by its anonymous id, so Guests have it too).
  const actor = await activityActor();
  const { data, error } = await supabase.rpc('get_voice_feed', { p_actor: actor });
  if (error || !data) return [];
  return data as VoicePost[];
}

export async function fetchPost(id: string): Promise<VoicePost | null> {
  const { data, error } = await supabase.rpc('get_voice_post', { p_id: id });
  if (error || !data || data.length === 0) return null;
  return data[0] as VoicePost;
}

export async function fetchMyPosts(userId: string): Promise<VoicePost[]> {
  const { data, error } = await supabase
    .from('voice_posts')
    .select('id, user_id, title, body, image_url, for_meditation, status, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error || !data) return [];
  return data as VoicePost[];
}

interface SubmitPostInput {
  userId: string;
  title: string;
  body: string;
  imageUri: string | null;
  imageMimeType: string | null;
  forMeditation: boolean;
}

/** Uploads the photo first (if any) to the owner-scoped `voices` bucket, then inserts the post row — always as `status: 'pending'`, enforced server-side too (see the insert RLS policy). */
export async function submitPost(input: SubmitPostInput): Promise<{ error: string | null }> {
  try {
    let imageUrl: string | null = null;

    if (input.imageUri) {
      const ext = imageExtension(input.imageUri, input.imageMimeType);
      const unique = `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
      const path = `${input.userId}/${unique}.${ext}`;
      imageUrl = await uploadToBucket('voices', path, input.imageUri, input.imageMimeType);
    }

    const { error: insertError } = await supabase.from('voice_posts').insert({
      user_id: input.userId,
      title: input.title.trim() || null,
      body: input.body.trim() || null,
      image_url: imageUrl,
      for_meditation: input.forMeditation,
      status: 'pending',
    });
    if (insertError) throw insertError;

    return { error: null };
  } catch {
    return { error: 'unknown' };
  }
}

/** Deletes a post and its photo, so the photo's public link stops working too. */
export async function deletePost(id: string): Promise<void> {
  const { data } = await supabase.from('voice_posts').select('image_url').eq('id', id).maybeSingle();
  await supabase.from('voice_posts').delete().eq('id', id);
  const marker = '/storage/v1/object/public/voices/';
  const url: string | null = data?.image_url ?? null;
  const at = url ? url.indexOf(marker) : -1;
  if (url && at >= 0) {
    const path = decodeURIComponent(url.slice(at + marker.length).split('?')[0]);
    await supabase.storage.from('voices').remove([path]).catch(() => {});
  }
}

export const REPORT_REASONS = ['harmful', 'harassment', 'spam', 'personal', 'other'] as const;
export type ReportReason = (typeof REPORT_REASONS)[number];

/**
 * Reports a post: it's hidden from this phone's feed at once, and three reports from different
 * phones send it back to moderation (report_voice_post). Returns false on failure.
 */
export async function reportPost(postId: string, reason: ReportReason): Promise<boolean> {
  const actor = await activityActor();
  if (!actor) return false;
  const { error } = await supabase.rpc('report_voice_post', { p_post_id: postId, p_actor: actor, p_reason: reason });
  return !error;
}

/** Blocks the author of a post: none of their posts show on this phone. Returns false on failure. */
export async function blockAuthor(postId: string): Promise<boolean> {
  const actor = await activityActor();
  if (!actor) return false;
  const { error } = await supabase.rpc('block_voice_author', { p_post_id: postId, p_actor: actor });
  return !error;
}

/** How many authors this phone has blocked. */
export async function countBlocked(): Promise<number> {
  const actor = await activityActor();
  if (!actor) return 0;
  const { data, error } = await supabase.rpc('count_voice_blocks', { p_actor: actor });
  return error || typeof data !== 'number' ? 0 : data;
}

/** Unblocks everyone this phone blocked. */
export async function unblockAll(): Promise<void> {
  const actor = await activityActor();
  if (actor) await supabase.rpc('unblock_voice_authors', { p_actor: actor });
}
