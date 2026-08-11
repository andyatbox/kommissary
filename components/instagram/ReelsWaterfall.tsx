import type { Reel } from '@/lib/instagram/api';
import ReelCard from './ReelCard';

/**
 * The reels waterfall. A plain responsive grid rather than a masonry layout — every reel
 * is 9:16, so the rows already line up and masonry would buy nothing but complexity.
 */
export default function ReelsWaterfall({ reels }: { reels: Reel[] }) {
  if (!reels.length) {
    return (
      <p className="mx-auto w-full max-w-3xl px-6 text-center text-white/50 sm:px-8">
        Instagram feed is unavailable right now.
      </p>
    );
  }

  return (
    <div className="w-full px-6 sm:px-10 lg:px-16">
      <div className="mx-auto grid max-w-[1400px] grid-cols-2 gap-4 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
        {reels.map((reel) => (
          <ReelCard key={reel.id} reel={reel} />
        ))}
      </div>
    </div>
  );
}
