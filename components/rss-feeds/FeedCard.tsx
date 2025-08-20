import Image from "next/image";
import { FeedItem } from "@/types.db";
import { Newspaper, TrendingUp, ExternalLink, Calendar, User } from "lucide-react";
import { categorizeByRegion } from "@/utils/feedUtils";

type FeedCardProps = {
  feed: FeedItem;
  size?: 'small' | 'medium' | 'large' | 'featured';
  className?: string;
};

// Format date to be more readable
const formatDate = (dateString?: string) => {
  if (!dateString) return "";
  
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(date);
  } catch (e) {
    return dateString;
  }
};

// Enhanced FeedCard with size variants for dynamic grid layouts
export const FeedCard = ({ feed, size = 'medium', className = '' }: FeedCardProps) => {
  const region = categorizeByRegion(feed);
  const regionDisplay =
    region === "african" ? "Africa" : "International";

  const hasImage =
    feed.imageUrl || (feed.enclosure && feed.enclosure.url && feed.enclosure.type?.startsWith("image/"));
  const imageUrl = feed.imageUrl || (feed.enclosure && feed.enclosure.url);
  const formattedDate = formatDate(feed.pubDate);

  // Featured card (large with prominent image)
  if (size === 'featured' && hasImage && imageUrl) {
    return (
      <article className={`group relative rounded-3xl border border-slate-200/60 bg-white overflow-hidden transition-all duration-500 hover:shadow-2xl h-full ${className}`}>
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-800/50 to-transparent z-10" />
        <div className="relative h-full min-h-[400px] w-full bg-slate-100">
          <Image
            src={imageUrl}
            alt={feed.title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover group-hover:scale-110 transition-transform duration-700"
            priority={true}
            placeholder="blur"
            blurDataURL="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw=="
          />
          <div className="absolute inset-0 z-20 flex flex-col justify-end p-8">
            <div className="mb-4 flex items-center justify-between">
              <span className="rounded-2xl bg-blue-600/90 px-4 py-2 text-sm font-semibold text-white backdrop-blur-md shadow-lg">
                {regionDisplay}
              </span>
              <time className="text-sm font-medium text-white/90 bg-black/20 rounded-xl px-3 py-1 backdrop-blur-sm" dateTime={feed.isoDate || feed.pubDate}>
                {formattedDate}
              </time>
            </div>
            <h3 className="mb-4 text-3xl font-bold leading-tight text-white drop-shadow-lg">{feed.title}</h3>
            <p className="mb-6 line-clamp-2 text-base leading-relaxed text-white/95 drop-shadow-sm">{feed.contentSnippet}</p>
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-white/90 bg-black/20 rounded-xl px-3 py-2 backdrop-blur-sm">{feed.creator || "Unknown"}</span>
              <a
                href={feed.link}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Read more: ${feed.title}`}
                className="flex items-center gap-2 rounded-2xl bg-white/90 px-6 py-3 text-sm font-semibold text-slate-900 backdrop-blur-md transition-all hover:bg-white hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-white/50"
              >
                Read Article
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>
      </article>
    );
  }

  // Large card with image
  if ((size === 'large' || size === 'medium') && hasImage && imageUrl) {
    const imageHeight = size === 'large' ? 'h-64' : 'h-48';
    
    return (
      <article className={`group rounded-2xl border border-slate-200/60 bg-white overflow-hidden transition-all duration-300 hover:shadow-xl h-full ${className}`}>
        <div className={`relative ${imageHeight} bg-slate-100`}>
          <Image
            src={imageUrl}
            alt={feed.title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            priority={size === 'large'}
            placeholder="blur"
            blurDataURL="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw=="
          />
          <div className="absolute top-4 left-4 z-10">
            <span className="rounded-xl bg-blue-600/90 px-3 py-1.5 text-xs font-semibold text-white shadow-lg backdrop-blur-md">
              {regionDisplay}
            </span>
          </div>
        </div>
        <div className="p-8">
          <div className="mb-4 flex items-center gap-4 text-sm text-slate-500">
            <div className="flex items-center gap-2">
              <Calendar size={16} className="text-slate-400" />
              <time dateTime={feed.isoDate || feed.pubDate} className="font-medium">
                {formattedDate}
              </time>
            </div>
            {feed.creator && (
              <div className="flex items-center gap-2">
                <User size={16} className="text-slate-400" />
                <span className="font-medium">{feed.creator}</span>
              </div>
            )}
          </div>
          <h3 className="mb-4 line-clamp-3 text-xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors leading-tight">{feed.title}</h3>
          <p className="mb-6 line-clamp-3 text-base text-slate-600 leading-relaxed">{feed.contentSnippet}</p>
          <div className="flex items-center justify-end">
            <a
              href={feed.link}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Read more: ${feed.title}`}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-6 py-3 text-base font-semibold text-slate-700 transition-all hover:bg-blue-50 hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              Read More
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
      </article>
    );
  }

  // Small card (compact, no image or with small image)
  if (size === 'small') {
    return (
      <article className={`group rounded-xl border border-slate-200/60 bg-white overflow-hidden transition-all duration-300 hover:shadow-lg h-full ${className}`}>
        <div className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <span className="inline-flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-blue-500" aria-hidden />
              <span className="text-sm font-semibold text-blue-600">{regionDisplay}</span>
            </span>
            <time className="text-sm font-medium text-slate-500" dateTime={feed.isoDate || feed.pubDate}>
              {formattedDate}
            </time>
          </div>
          <h3 className="mb-4 line-clamp-3 text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors leading-tight">{feed.title}</h3>
          {hasImage && imageUrl ? (
            <div className="relative mb-3 h-40 w-full overflow-hidden rounded-lg bg-slate-100">
              <Image
                src={imageUrl}
                alt={feed.title}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                className="object-cover group-hover:scale-105 transition-transform duration-300"
                placeholder="blur"
                blurDataURL="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw=="
              />
            </div>
          ) : (
            <p className="mb-4 line-clamp-3 text-sm text-slate-600 leading-relaxed">{feed.contentSnippet}</p>
          )}
          <div className="flex items-center justify-between">
            <a
              href={feed.link}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Read more: ${feed.title}`}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-700 hover:underline focus:outline-none"
            >
              Read More
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        </div>
      </article>
    );
  }

  // Default card (no image)
  return (
    <article className={`group rounded-2xl border border-slate-200/60 bg-white overflow-hidden transition-all duration-300 shadow-sm hover:shadow-lg focus-within:ring-2 focus-within:ring-blue-500/20 h-full ${className}`}>
      <div className="h-1 bg-gradient-to-r from-blue-500 to-indigo-600" />

      <div className="p-8">
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100">
              <Newspaper className="h-5 w-5 text-blue-600" />
            </span>
            <span className="rounded-xl bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700">
              {regionDisplay}
            </span>
          </div>
          <time className="text-sm font-medium text-slate-500" dateTime={feed.isoDate || feed.pubDate}>
            {formattedDate}
          </time>
        </div>

        <h3 className="mb-5 line-clamp-3 text-xl font-bold leading-tight text-slate-900 group-hover:text-blue-600 transition-colors">{feed.title}</h3>
        <p className="mb-6 line-clamp-4 text-base leading-relaxed text-slate-600">{feed.contentSnippet}</p>

        <div className="flex items-center justify-between border-t border-slate-100 pt-4">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-slate-400" />
            <span className="text-sm font-medium text-slate-500">{feed.creator || "Unknown"}</span>
          </div>
          <a
            href={feed.link}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Read more: ${feed.title}`}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-50 px-6 py-3 text-sm font-semibold text-blue-700 transition-all hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            Read More
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>
      </div>
    </article>
  );
};