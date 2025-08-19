"use client";

import Link from "next/link";
import { Bell, Search as SearchIcon } from "lucide-react";
import dynamic from "next/dynamic";
const ProfileMenu = dynamic(() => import("../ProfileMenu"), { ssr: false });
import { ReactNode } from "react";
import { TickerStrip } from "../ticker/TickerBar";

// Accessible site layout with Header / Main / Footer
// - Includes skip link, keyboard focus styles, and global search
// - Header actions: search input, notifications icon, avatar placeholder
// - Uses CSS variables from globals.css tokens

type LayoutProps = {
  children: ReactNode;
};

export default function Layout({ children }: LayoutProps) {
  return (
    <>
      <div className="min-h-screen bg-background text-foreground">
        {/* Skip link for keyboard users */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:bg-primary focus:px-3 focus:py-2 focus:text-primary-foreground"
        >
          Skip to main content
        </a>

        <Header />

        <main id="main-content" className="w-full">
          {children}
        </main>

        <Footer />
      </div>
    </>
  );
}

function Header() {
  return (
    <header
      className="sticky top-0 z-40 border-b border-primary-100 bg-white shadow-md backdrop-blur-md supports-[backdrop-filter]:bg-white/95"
      role="banner"
      style={{ overflow: 'visible' }}
    >
      {/* Exchange Ticker at the top */}
      <div className="border-b border-blue-200 bg-white/80 backdrop-blur-md">
        <div className="px-6 py-2">
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-sm font-semibold tracking-tight text-foreground">
              Live Exchange Rates <span className="text-slate-400">(RBZ Official Rates)</span>
            </h2>
          </div>
          <TickerStrip className="rounded-lg shadow-sm" />
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto" style={{ overflow: 'visible' }}>
        <div className="flex h-16 w-full items-center justify-between gap-3 px-4 sm:px-6" style={{ overflow: 'visible' }}>
          {/* Brand */}
          <Link href="/" className="flex items-center gap-2.5 focus:outline-none focus:ring-2 focus:ring-primary-300 rounded-md group">
            <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-primary-600 to-primary-800 shadow-md group-hover:shadow-lg transition-all duration-300" aria-hidden="true">
              <div className="h-full w-full flex items-center justify-center text-white font-bold text-lg">A</div>
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-semibold tracking-tight text-primary-900">Arcus</span>
              <span className="text-xs text-primary-600/90 font-medium">Financial Hub</span>
            </div>
          </Link>

          {/* Global search - Enhanced */}
          <form
            role="search"
            aria-label="Global search"
            className="relative hidden sm:flex min-w-0 flex-1 items-center justify-center max-w-xl mx-auto px-4"
            onSubmit={(e) => e.preventDefault()}
          >
            <div className="relative w-full group">
              <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-primary-400 group-hover:text-primary-500 transition-colors duration-200" size={18} />
              <input
                type="search"
                name="q"
                placeholder="Search news, markets, people…"
                aria-label="Search"
                className="w-full rounded-full border border-primary-200 bg-white/90 py-2 pl-10 pr-12 text-sm font-medium placeholder:text-primary-300 outline-none focus:border-primary-300 focus:ring-4 focus:ring-primary-100/50 shadow-sm hover:shadow transition-all duration-200"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 hidden md:flex items-center gap-1 text-xs text-primary-400">
                <kbd className="px-1.5 py-0.5 bg-primary-50 rounded-md border border-primary-200 text-[10px]">⌘</kbd>
                <kbd className="px-1.5 py-0.5 bg-primary-50 rounded-md border border-primary-200 text-[10px]">K</kbd>
              </div>
            </div>
          </form>

          {/* Actions */}
          <div className="flex items-center gap-2 sm:gap-3" style={{ overflow: 'visible' }}>
            <button
              type="button"
              aria-label="Search"
              className="sm:hidden inline-flex h-9 w-9 items-center justify-center rounded-full border border-primary-200 bg-white text-primary-500 hover:bg-primary-50 hover:text-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-200 transition-all duration-200"
            >
              <SearchIcon size={18} />
            </button>
            
            <button
              type="button"
              aria-label="Notifications"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-primary-200 bg-white text-primary-500 hover:bg-primary-50 hover:text-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-200 transition-all duration-200 relative"
            >
              <Bell size={16} />
              <span className="absolute top-0 right-0 h-2.5 w-2.5 rounded-full bg-accent-danger border-2 border-white"></span>
            </button>

            <ProfileMenu />
          </div>
        </div>
      </div>
      
      {/* Mobile Search - Appears below header on small screens */}
      <div className="sm:hidden border-t border-primary-100 bg-white px-4 py-2">
        <div className="relative w-full">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-primary-400" size={16} />
          <input
            type="search"
            placeholder="Search..."
            className="w-full rounded-lg border border-primary-200 bg-white py-2 pl-9 pr-3 text-sm placeholder:text-primary-300 focus:border-primary-300 focus:ring-2 focus:ring-primary-100"
          />
        </div>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="border-t border-blue-100 bg-gradient-to-r from-blue-50 via-indigo-50 to-blue-50">
      <div className="max-w-5xl mx-auto px-4 py-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Left side - Company Info */}
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="h-6 w-6 rounded-md bg-gradient-to-br from-blue-600 to-indigo-500 flex items-center justify-center text-white font-bold text-xs">A</div>
            <span className="text-sm font-medium text-blue-900">Arcus</span>
          </Link>
          
          {/* Right side - Developer Info */}
          <div className="flex items-center gap-3">
            <span className="text-xs text-blue-700/70">Developed by</span>
            <a
              href="https://www.niakazi.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-md border border-blue-200 shadow-sm hover:shadow transition-all duration-200"
            >
              <span className="text-xs font-medium text-blue-800 group-hover:text-blue-600 transition-colors">
                Niakazi Technology Solutions
              </span>
            </a>
          </div>
          
          {/* Copyright - Mobile: Full width, Desktop: Right aligned */}
          <div className="w-full md:w-auto text-center md:text-right text-[10px] text-blue-600/60 mt-1 md:mt-0">
            © {new Date().getFullYear()} Niakazi Technology. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
}