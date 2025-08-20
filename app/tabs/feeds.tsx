"use client";

import React, { useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import {
  Search,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Newspaper,
  BarChart3,
  Globe,
  Filter,
  RefreshCw,
  MapPin,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ZW } from "country-flag-icons/react/3x2";

// External components / utils from your codebase
import { FeedItem, BankRatesResponse } from "@/types.db";
import { BankRatesCard } from "@/components/rss-feeds/BankRatesCard";
import { FeedCard } from "@/components/rss-feeds/FeedCard";
import { categories, isFinancialOrEconomic, categorizeByRegion } from "@/utils/feedUtils";
import ZimFinancialData from "@/components/MenuAllFinancialData";
import FloatingRBZData from "@/components/rss-feeds/FloatingRBZData";
import WeatherCard from "@/components/rss-feeds/sidebar/WeatherCard";

// ---------------------------------------------------------------------------
// Fetcher
const fetcher = async (url: string) => fetch(url).then((res) => res.json());

// ---------------------------------------------------------------------------
// Combined Rate Card (polished + mobile-friendly)
const CombinedRateCard = ({
  cryptoData,
  forexData,
  cryptoLoading,
  forexLoading,
}: {
  cryptoData: any[];
  forexData: any[];
  cryptoLoading: boolean;
  forexLoading: boolean;
}) => {
  const [currentView, setCurrentView] = useState<"crypto" | "forex">("crypto");
  const [isTransitioning, setIsTransitioning] = useState(false);

  const switchView = (newView: "crypto" | "forex") => {
    if (newView !== currentView && !isTransitioning) {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentView(newView);
        setIsTransitioning(false);
      }, 150);
    }
  };

  const getCurrentTitle = () => (currentView === "crypto" ? "Cryptocurrency" : "Forex Rates");
  const isCurrentlyLoading = () => (currentView === "crypto" ? cryptoLoading : forexLoading);
  const list = currentView === "crypto" ? cryptoData : forexData;

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-indigo-500/30 bg-gradient-to-br from-indigo-900/90 via-indigo-800/90 to-purple-900/90 p-2.5 shadow-[0_8px_24px_rgba(79,70,229,0.18)] backdrop-blur-xl transition-all duration-300 hover:shadow-[0_8px_26px_rgba(79,70,229,0.26)]">
      {/* Animated background effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/10 via-purple-600/5 to-blue-600/10 opacity-30" />
      <div className="absolute -inset-[100%] animate-[spin_60s_linear_infinite] bg-[conic-gradient(from_0deg,transparent_0_340deg,rgba(56,189,248,0.1)_360deg)] blur-3xl" />
      
      {/* Header */}
      <div className="relative mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg">
            <DollarSign size={16} />
          </span>
          <div>
            <h3 className="text-sm font-semibold text-white">
              {getCurrentTitle()}
            </h3>
            <p className="text-xs text-indigo-200/80">Live rates</p>
          </div>
          {isCurrentlyLoading() && (
            <span className="ml-2 inline-block align-middle">
              <span className="h-3 w-3 animate-spin rounded-full border-b-2 border-t-2 border-indigo-300" />
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => switchView("crypto")}
            className={`h-3 w-3 rounded-full transition-all ${
              currentView === "crypto" 
                ? "bg-indigo-400 shadow-[0_0_0_4px_rgba(129,140,248,0.3)]" 
                : "bg-indigo-700 hover:bg-indigo-600"
            }`}
            aria-label="Show crypto"
          />
          <button
            onClick={() => switchView("forex")}
            className={`h-3 w-3 rounded-full transition-all ${
              currentView === "forex" 
                ? "bg-indigo-400 shadow-[0_0_0_4px_rgba(129,140,248,0.3)]" 
                : "bg-indigo-700 hover:bg-indigo-600"
            }`}
            aria-label="Show forex"
          />
        </div>
      </div>

      {/* List */}
      <div className="relative rounded-xl bg-indigo-950/30 p-1.5 backdrop-blur-sm">
        <AnimatePresence mode="wait">
          <motion.ul
            key={currentView}
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.18 }}
            className={`divide-y divide-indigo-800/50 ${isTransitioning ? "pointer-events-none opacity-60" : "opacity-100"}`}
          >
            {list.slice(0, 4).map((item, idx) => (
              <li
                key={`${currentView}-${idx}`}
                className="flex min-h-[36px] items-center justify-between gap-2 rounded-lg py-1.5 px-2 transition-colors hover:bg-indigo-800/30"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-indigo-100">
                    {currentView === "crypto" ? item.symbol : item.pair}
                  </p>
                </div>
                <div className="flex min-w-0 items-center gap-2">
                  <span className="min-w-0 truncate text-right text-sm font-bold text-white">
                    {currentView === "crypto" ? item.price : item.rate}
                  </span>
                  <span
                    className={`inline-flex min-w-0 items-center truncate rounded-full px-2 py-0.5 text-xs font-medium ${
                      item.trend === "up"
                        ? "bg-emerald-500/20 text-emerald-300"
                        : item.trend === "down"
                        ? "bg-rose-500/20 text-rose-300"
                        : "text-indigo-200"
                    }`}
                  >
                    {item.trend === "up" ? (
                      <TrendingUp className="mr-1 h-3 w-3 flex-shrink-0" />
                    ) : item.trend === "down" ? (
                      <TrendingDown className="mr-1 h-3 w-3 flex-shrink-0" />
                    ) : null}
                    <span className="truncate">{item.change}</span>
                  </span>
                </div>
              </li>
            ))}
          </motion.ul>
        </AnimatePresence>
      </div>

      {/* Nav controls (mobile friendly) */}
      <div className="relative mt-2 flex items-center justify-between">
        <button
          onClick={() => switchView(currentView === "crypto" ? "forex" : "crypto")}
          className="rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 px-2 py-1 text-xs font-medium text-white shadow-md transition-all hover:shadow-lg"
        >
          {currentView === "crypto" ? "Forex" : "Crypto"}
        </button>
        <div className="flex items-center gap-1">
          <button
            onClick={() => switchView("crypto")}
            className="rounded-full bg-indigo-800/50 p-1 text-indigo-200 transition-colors hover:bg-indigo-700 hover:text-white"
            aria-label="Crypto"
          >
            <ChevronLeft size={14} />
          </button>
          <button
            onClick={() => switchView("forex")}
            className="rounded-full bg-indigo-800/50 p-1 text-indigo-200 transition-colors hover:bg-indigo-700 hover:text-white"
            aria-label="Forex"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
const FeedPage = () => {
  const [mounted, setMounted] = useState(false);

  const { data, error, isLoading: feedsLoading, mutate } = useSWR<{ items: FeedItem[] }>(
    mounted ? "/api/feeds" : null,
    fetcher
  );
  const { data: cryptoData, isLoading: cryptoLoading } = useSWR(mounted ? "/api/crypto" : null, fetcher);
  const { data: forexData, isLoading: forexLoading } = useSWR(mounted ? "/api/forex" : null, fetcher);
  const { data: bankRatesData, isLoading: bankRatesLoading } = useSWR<BankRatesResponse>(
    mounted ? "/api/bankRates" : null,
    fetcher
  );

  const [selectedCategory, setSelectedCategory] = useState("african");
  
  // Prevent category from changing unexpectedly
  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategory(categoryId);
    // Scroll to top of feeds container to prevent scroll interference
    const feedsContainer = document.querySelector('[data-feeds-container]');
    if (feedsContainer) {
      feedsContainer.scrollTop = 0;
    }
  };
  const [searchTerm, setSearchTerm] = useState("");
  const [visibleCount, setVisibleCount] = useState(24); // Show more articles to fill the grid

  useEffect(() => setMounted(true), []);

  const feedsData = data?.items || [];

  const filteredFeeds = useMemo(
    () =>
      feedsData.filter((feed) => {
        if (!isFinancialOrEconomic(feed)) return false; // domain filter first
        const feedCategory = categorizeByRegion(feed);
        if (feedCategory !== selectedCategory) return false; // region filter
        if (!searchTerm) return true; // text search
        const q = searchTerm.toLowerCase();
        return (
          feed.title.toLowerCase().includes(q) || feed.contentSnippet?.toLowerCase().includes(q)
        );
      }),
    [feedsData, selectedCategory, searchTerm]
  );

  const refresh = async () => {
    await mutate();
  };

  // Fallback rates when APIs are empty
  const getRatesData = () => {
    let forexRates = [
      { pair: "USD/ZWL", rate: "24,500", change: "+0.8%", trend: "up" },
      { pair: "USD/GBP", rate: "1.2680", change: "-0.3%", trend: "down" },
      { pair: "USD/EUR", rate: "1.0925", change: "+0.1%", trend: "up" },
    ];
    if (forexData && (forexData as any).success && (forexData as any).data) {
      forexRates = (forexData as any).data;
    } else if (Array.isArray(forexData)) {
      forexRates = forexData as any;
    }

    return {
      crypto:
        (Array.isArray(cryptoData) && cryptoData) ||
        [
          { symbol: "BTC", price: "$43,250", change: "+2.4%", trend: "up" },
          { symbol: "ETH", price: "$2,580", change: "-1.2%", trend: "down" },
          { symbol: "BNB", price: "$315", change: "+0.8%", trend: "up" },
          { symbol: "ADA", price: "$0.52", change: "+3.1%", trend: "up" },
        ],
      forex: forexRates,
    };
  };

  if (!mounted) {
    return (
      <div className="grid min-h-[60vh] place-items-center">
        <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-t-2 border-sky-500" />
      </div>
    );
  }

  if (feedsLoading) {
    return (
      <div className="mx-auto max-w-7xl p-4">
        <div className="mb-4 h-10 w-64 animate-pulse rounded-lg bg-slate-800/50" />
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-40 animate-pulse rounded-2xl border border-slate-700/60 bg-slate-800/40"
            />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-2xl p-4">
        <div className="rounded-2xl border border-rose-400/30 bg-rose-500/10 p-4 text-rose-200">
          Error loading feeds: {(error as any).message}
        </div>
      </div>
    );
  }

  const rates = getRatesData();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50" data-feeds-container>
      {/* Enhanced Header with better visual hierarchy */}
      <header className="sticky top-0 z-20 border-b border-slate-200/60 bg-white/95 backdrop-blur-xl shadow-sm">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 shadow-lg" />
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-400/20 to-purple-400/20 blur-xl" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                  Financial News Hub
                </h1>
                <p className="text-sm font-medium text-slate-600">Real-time insights • Global markets • Live data</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 text-sm text-slate-500">
                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                <span>Live</span>
              </div>
              <button
                onClick={refresh}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition-all hover:bg-slate-50 hover:border-slate-300 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <RefreshCw size={16} />
                <span className="hidden sm:inline">Refresh</span>
              </button>
            </div>
          </div>
        </div>
      </header>



      {/* RBZ + Summary modules */}
      <section className="mx-auto max-w-7xl px-2 py-2 sm:px-3">
        {/* <div className="mb-2"><FloatingRBZData /></div> */}
        <div className="mb-2"><ZimFinancialData /></div>
      </section>

      {/* Main layout - Enhanced Magazine Grid */}
      <main className="mx-auto max-w-7xl px-4 pb-8 sm:px-6">
        {/* Enhanced Search & Filters */}
        <div className="mb-6 rounded-3xl border border-slate-200/60 bg-white/80 p-6 shadow-lg backdrop-blur-xl">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                type="text"
                placeholder="Search financial news, markets, analysis..."
                className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 py-3.5 pl-12 pr-4 text-sm text-slate-900 placeholder:text-slate-500 outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:shadow-lg"
              />
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Filter size={18} className="text-slate-400" />
                <span className="font-medium">Filters</span>
              </div>
              <div className="h-6 w-px bg-slate-200" />
              <span className="text-sm font-medium text-slate-500">
                {filteredFeeds.length} articles
              </span>
            </div>
          </div>

          {/* Enhanced Category pills */}
          <div className="mt-4 flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => handleCategoryChange(category.id)}
                className={`flex-shrink-0 inline-flex items-center gap-2.5 rounded-2xl px-4 py-2.5 text-sm font-semibold transition-all duration-200 ${
                  selectedCategory === category.id
                    ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/25 scale-105"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-900 hover:shadow-md"
                }`}
              >
                {category.id === "african" ? (
                  <MapPin size={16} className={selectedCategory === category.id ? "text-white" : "text-slate-500"} />
                ) : (
                  <Globe size={16} className={selectedCategory === category.id ? "text-white" : "text-slate-500"} />
                )}
                <span>{category.name}</span>
                {selectedCategory === category.id && (
                  <div className="h-1.5 w-1.5 rounded-full bg-white/80" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Enhanced Dynamic Magazine Grid Layout */}
        {filteredFeeds.length > 0 && !feedsLoading && (
          <>
            <div 
              className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-2" 
              style={{ 
                gridAutoFlow: 'row dense', 
                gridAutoRows: 'minmax(240px, auto)',
                gridTemplateRows: 'repeat(auto-fit, minmax(240px, auto))'
              }} 
              aria-live="polite" 
              aria-busy={feedsLoading}
            >
              {(() => {
                // Separate feeds with and without images
                const feedsWithImages = filteredFeeds.filter(feed => 
                  feed.imageUrl || (feed.enclosure && feed.enclosure.url)
                );
                const feedsWithoutImages = filteredFeeds.filter(feed => 
                  !feed.imageUrl && !(feed.enclosure && feed.enclosure.url)
                );

                // Create the grid items array including crypto, weather, and feeds
                const gridItems = [];

                // Add crypto card as first item (bigger tile)
                gridItems.push({
                  type: 'crypto',
                  component: (
                    <motion.div
                      initial={{ y: 10, opacity: 0 }}
                      whileInView={{ y: 0, opacity: 1 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.3, delay: 0.1 }}
                      className="col-span-1 md:col-span-1 lg:col-span-1 row-span-1"
                    >
                      <CombinedRateCard
                        cryptoData={rates.crypto}
                        forexData={rates.forex}
                        cryptoLoading={cryptoLoading}
                        forexLoading={forexLoading}
                      />
                    </motion.div>
                  )
                });

                // Add weather card as second item (bigger tile)
                gridItems.push({
                  type: 'weather',
                  component: (
                    <motion.div
                      initial={{ y: 10, opacity: 0 }}
                      whileInView={{ y: 0, opacity: 1 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.3, delay: 0.2 }}
                      className="col-span-1 md:col-span-1 lg:col-span-1 row-span-1"
                    >
                      <WeatherCard className="w-full h-full" />
                    </motion.div>
                  )
                });

                // Add feeds prioritizing images
                let imageIndex = 0;
                let textIndex = 0;
                let feedItemIndex = 0;

                // Improved algorithm to minimize white space
                const extra = selectedCategory === 'international' ? 1 : selectedCategory === 'african' ? 2 : 0;
                const totalItems = Math.min(
                  visibleCount + extra,
                  feedsWithImages.length + feedsWithoutImages.length
                );
                
                while (gridItems.length < totalItems + 2 && (imageIndex < feedsWithImages.length || textIndex < feedsWithoutImages.length)) {
                  // Prioritize filling with image content first, then text content
                  if (imageIndex < feedsWithImages.length) {
                    const feed = feedsWithImages[imageIndex];
                    let colSpan: string, rowSpan: string, size: 'small' | 'medium' | 'large' | 'featured';

                    // Make all articles bigger and fill the grid better
                    if (feedItemIndex === 0) {
                      // First image article gets featured tile (spans 2 columns)
                      colSpan = 'col-span-1 md:col-span-2 lg:col-span-2';
                      rowSpan = 'row-span-3';
                      size = 'featured';
                    } else if (feedItemIndex % 4 === 0 && feedItemIndex > 0) {
                      // Every 4th image article gets large tile (spans 2 columns)
                      colSpan = 'col-span-1 md:col-span-2 lg:col-span-2';
                      rowSpan = 'row-span-2';
                      size = 'large';
                    } else if (feedItemIndex % 3 === 0) {
                      // Every 3rd image article gets large tile
                      colSpan = 'col-span-1 md:col-span-1 lg:col-span-2';
                      rowSpan = 'row-span-2';
                      size = 'large';
                    } else {
                      // Other image items get medium tiles (bigger than before)
                      colSpan = 'col-span-1 md:col-span-1 lg:col-span-1';
                      rowSpan = 'row-span-2';
                      size = 'medium';
                    }

                    gridItems.push({
                      type: 'feed',
                      component: (
                        <motion.div
                          key={feed.guid || `image-${imageIndex}`}
                          initial={{ y: 10, opacity: 0 }}
                          whileInView={{ y: 0, opacity: 1 }}
                          viewport={{ once: true, margin: "-50px" }}
                          transition={{ duration: 0.25, delay: 0.05 * feedItemIndex, ease: "easeOut" }}
                          className={`group relative ${colSpan} ${rowSpan}`}
                        >
                          <div className="h-full relative overflow-hidden rounded-2xl shadow-lg transition-all duration-300 hover:shadow-2xl hover:scale-[1.02] hover:-translate-y-1">
                            <FeedCard feed={feed} size={size} />
                            <div className="pointer-events-none absolute -inset-8 opacity-0 blur-3xl transition-all duration-500 group-hover:opacity-30" 
                                 style={{ background: "radial-gradient(800px circle at 50% 50%, rgba(59,130,246,0.15), rgba(147,51,234,0.1), transparent 70%)" }} />
                          </div>
                        </motion.div>
                      )
                    });

                    imageIndex++;
                    feedItemIndex++;
                  }
                  
                  // Fill remaining space with text items (smaller cards)
                  if (imageIndex >= feedsWithImages.length && textIndex < feedsWithoutImages.length) {
                    const feed = feedsWithoutImages[textIndex];
                    
                    gridItems.push({
                      type: 'feed',
                      component: (
                        <motion.div
                          key={feed.guid || `text-${textIndex}`}
                          initial={{ y: 10, opacity: 0 }}
                          whileInView={{ y: 0, opacity: 1 }}
                          viewport={{ once: true, margin: "-50px" }}
                          transition={{ duration: 0.25, delay: 0.05 * feedItemIndex, ease: "easeOut" }}
                          className="group relative col-span-1 md:col-span-1 lg:col-span-1 row-span-1"
                        >
                          <div className="h-full relative overflow-hidden rounded-2xl shadow-md transition-all duration-300 hover:shadow-xl hover:scale-[1.02] hover:-translate-y-1 min-h-[240px]">
                            <FeedCard feed={feed} size="small" />
                            <div className="pointer-events-none absolute -inset-8 opacity-0 blur-3xl transition-all duration-500 group-hover:opacity-25" 
                                 style={{ background: "radial-gradient(600px circle at 50% 50%, rgba(59,130,246,0.12), rgba(147,51,234,0.08), transparent 70%)" }} />
                          </div>
                        </motion.div>
                      )
                    });

                    textIndex++;
                    feedItemIndex++;
                  }
                }

                return gridItems.map((item, idx) => item.component);
              })()}
            </div>

            {/* Enhanced Load more button */}
            {visibleCount < filteredFeeds.length && (
              <div className="mt-8 flex justify-center">
                <motion.button
                  onClick={() => setVisibleCount((c) => c + 12)}
                  className="group relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 px-8 py-4 text-sm font-semibold text-white shadow-xl transition-all hover:shadow-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/20"
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <span className="relative z-10 flex items-center gap-2">
                    Load more articles
                    <TrendingUp size={16} className="transition-transform group-hover:translate-x-1" />
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                  <div className="absolute -inset-4 bg-gradient-to-r from-blue-400/20 to-purple-400/20 blur-xl opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                </motion.button>
              </div>
            )}
          </>
        )}

        {/* Enhanced Empty state */}
        {filteredFeeds.length === 0 && !feedsLoading && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid place-items-center rounded-3xl border border-slate-200/60 bg-white/80 py-20 text-center shadow-lg backdrop-blur-xl"
          >
            <div className="relative mb-6">
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-400/20 to-purple-400/20 blur-2xl" />
              <Newspaper className="relative h-20 w-20 text-slate-400" />
            </div>
            <h3 className="mb-3 text-2xl font-bold text-slate-900">No articles found</h3>
            <p className="mb-8 max-w-md text-slate-600 leading-relaxed">
              We couldn't find any articles matching your criteria. Try adjusting your search terms or exploring different categories.
            </p>
            <motion.button 
              onClick={() => {
                setSearchTerm('');
                handleCategoryChange('african');
              }}
              className="rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-lg transition-all hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-blue-500/20"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
            >
              Reset filters & explore
            </motion.button>
          </motion.div>
        )}
      </main>
    </div>
  );
};

export default FeedPage;
