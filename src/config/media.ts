/**
 * Large audio/video live on Vercel Blob so each deploy stays small
 * (Hobby Deployment Storage). Override with NEXT_PUBLIC_MEDIA_BASE_URL if needed.
 */
export const mediaBase =
  process.env.NEXT_PUBLIC_MEDIA_BASE_URL?.replace(/\/$/, '') ||
  'https://osygqzwergmstvtq.public.blob.vercel-storage.com/invite';

export const media = {
  music: `${mediaBase}/audio/islamic-calm.mp3`,
  videos: {
    opening: `${mediaBase}/videos/opening.mp4`,
    openingPoster: `${mediaBase}/videos/opening-poster.jpg`,
    closing: `${mediaBase}/videos/closing.mp4`,
    closingPoster: `${mediaBase}/videos/closing-poster.jpg`,
    mehndi: `${mediaBase}/videos/mehndi.mp4`,
    mehndiPoster: `${mediaBase}/videos/mehndi-poster.jpg`,
    baraat: `${mediaBase}/videos/baraat.mp4`,
    baraatPoster: `${mediaBase}/videos/baraat-poster.jpg`,
    waleema: `${mediaBase}/videos/waleema.mp4`,
    waleemaPoster: `${mediaBase}/videos/waleema-poster.jpg`,
  },
} as const;
