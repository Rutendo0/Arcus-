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
      <article className={`group relative rounded-xl border border-primary-100 bg-white overflow-hidden transition-all duration-300 hover:shadow-xl h-full ${className}`}>
        <div className="absolute inset-0 bg-gradient-to-t from-primary-950/95 via-primary-900/60 to-primary-900/20 z-10" />
        <div className="relative h-full min-h-[600px] w-full bg-primary-50">
          <Image
            src={imageUrl}
            alt={feed.title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover group-hover:scale-105 transition-transform duration-700"
            priority={true}
            placeholder="blur"
            blurDataURL="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw=="
          />
          <div className="absolute inset-0 z-20 flex flex-col justify-end p-6">
            <div className="mb-3 flex items-center justify-between">
              <span className="rounded-full bg-primary-600/80 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">
                {regionDisplay}
              </span>
              <time className="text-xs font-medium text-white/90" dateTime={feed.isoDate || feed.pubDate}>
                {formattedDate}
              </time>
            </div>
            <h3 className="mb-3 text-2xl font-bold leading-tight text-white">{feed.title}</h3>
            <p className="mb-4 line-clamp-2 text-sm leading-relaxed text-white/90">{feed.contentSnippet}</p>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-white/90">{feed.creator || "Unknown"}</span>
              <a
                href={feed.link}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Read more: ${feed.title}`}
                className="flex items-center gap-1 rounded-full bg-primary-600/90 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm transition-all hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-300"
              >
                Read Article
                <ExternalLink className="ml-1 h-3.5 w-3.5" />
              </a>
            </div>
          </div>
        </div>
      </article>
    );
  }

  // Large card with image
  if ((size === 'large' || size === 'medium') && hasImage && imageUrl) {
    const imageHeight = size === 'large' ? 'h-96' : 'h-72';
    
    return (
      <article className={`group rounded-xl border border-primary-100 bg-white overflow-hidden transition-all duration-300 hover:shadow-lg h-full ${className}`}>
        <div className={`relative ${imageHeight} bg-primary-50`}>
          <Image
            src={imageUrl}
            alt={feed.title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover group-hover:scale-102 transition-transform duration-500"
            priority={size === 'large'}
            placeholder="blur"
            blurDataURL="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw=="
          />
          <div className="absolute top-3 left-3 z-10">
            <span className="rounded-full bg-primary-600/90 px-2.5 py-1 text-xs font-medium text-white shadow-sm backdrop-blur-sm">
              {regionDisplay}
            </span>
          </div>
        </div>
        <div className="p-5">
          <div className="mb-3 flex items-center gap-3 text-xs text-primary-500">
            <div className="flex items-center gap-1">
              <Calendar size={14} />
              <time dateTime={feed.isoDate || feed.pubDate}>
                {formattedDate}
              </time>
            </div>
            {feed.creator && (
              <div className="flex items-center gap-1">
                <User size={14} />
                <span>{feed.creator}</span>
              </div>
            )}
          </div>
          <h3 className="mb-2 line-clamp-2 text-lg font-semibold text-primary-900 group-hover:text-primary-700 transition-colors">{feed.title}</h3>
          <p className="mb-4 line-clamp-2 text-sm text-primary-600/80">{feed.contentSnippet}</p>
          <div className="flex items-center justify-end">
            <a
              href={feed.link}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Read more: ${feed.title}`}
              className="inline-flex items-center gap-1 rounded-lg bg-primary-50 px-3 py-1.5 text-sm font-medium text-primary-700 transition-all hover:bg-primary-100 focus:outline-none focus:ring-2 focus:ring-primary-200"
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
      <article className={`group rounded-lg border border-primary-100 bg-white overflow-hidden transition-all duration-300 hover:shadow-md h-full ${className}`}>
        <div className="p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className={`h-1.5 w-1.5 rounded-full bg-primary-600`} aria-hidden />
            <time className="text-xs text-primary-500" dateTime={feed.isoDate || feed.pubDate}>
              {formattedDate}
            </time>
          </div>
          <h3 className="mb-2 line-clamp-2 text-sm font-semibold text-primary-900 group-hover:text-primary-700 transition-colors">{feed.title}</h3>
          {hasImage && imageUrl ? (
            <div className="relative mb-2 h-24 w-full overflow-hidden rounded-md bg-primary-50">
              <Image
                src={imageUrl}
                alt={feed.title}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                className="object-cover"
                placeholder="blur"
                blurDataURL="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw=="
              />
            </div>
          ) : (
            <p className="mb-2 line-clamp-2 text-xs text-primary-600/80">{feed.contentSnippet}</p>
          )}
          <div className="flex items-center justify-between">
            <a
              href={feed.link}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Read more: ${feed.title}`}
              className="text-xs font-medium text-primary-600 hover:text-primary-800 hover:underline focus:outline-none"
            >
              Read More
            </a>
          </div>
        </div>
      </article>
    );
  }

  // Default card (no image)
  return (
    <article className={`group rounded-xl border border-primary-100 bg-white overflow-hidden transition-all duration-300 shadow-sm hover:shadow focus-within:ring-2 focus-within:ring-primary-200 h-full ${className}`}>
      <div className="h-1 bg-gradient-to-r from-primary-500 to-primary-700" />

      <div className="p-4">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary-100">
              <Newspaper className="h-3 w-3 text-primary-700" />
            </span>
            <span className="rounded-full bg-primary-50 px-2.5 py-0.5 text-xs font-medium text-primary-700">
              {regionDisplay}
            </span>
          </div>
          <time className="text-xs font-medium text-primary-500" dateTime={feed.isoDate || feed.pubDate}>
            {formattedDate}
          </time>
        </div>

        <h3 className="mb-3 line-clamp-2 text-base font-semibold leading-tight text-primary-900 group-hover:text-primary-700 transition-colors">{feed.title}</h3>
        <p className="mb-4 line-clamp-3 text-sm leading-relaxed text-primary-600/80">{feed.contentSnippet}</p>

        <div className="flex items-center justify-between border-t border-primary-100 pt-3">
          <div className="flex items-center gap-2">
            <User className="h-3.5 w-3.5 text-primary-400" />
            <span className="text-xs font-medium text-primary-500">{feed.creator || "Unknown"}</span>
          </div>
          <a
            href={feed.link}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Read more: ${feed.title}`}
            className="rounded-full bg-primary-50 px-3 py-1 text-xs font-medium text-primary-700 transition-all hover:bg-primary-100 focus:outline-none focus:ring-2 focus:ring-primary-200"
          >
            Read More
          </a>
        </div>
      </div>
    </article>
  );
};