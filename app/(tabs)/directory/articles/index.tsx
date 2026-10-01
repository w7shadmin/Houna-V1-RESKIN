import React from 'react';
import MediaHub from '@/components/directory/MediaHub';

/** Read & listen, opened on All (articles and podcasts together; components/directory/MediaHub.tsx). */
export default function ArticlesScreen() {
  return <MediaHub initialTab="all" />;
}
