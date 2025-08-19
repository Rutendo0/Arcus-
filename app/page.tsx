'use client'

import ProfileMenu from "@/components/ProfileMenu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Variants } from "framer-motion";
import { useRouter } from "next/navigation";
import { Filter } from "lucide-react";
import { EventsData, NewsletterData, PostsData } from "@/types.db";
import Posts from "./tabs/posts";
import EventsCalendar from "./tabs/calendar";
import NewsletterCarousel from "./tabs/newsletter";
import FeedPage from "./tabs/feeds";
import HeroClient from "./HeroClient";
import { ChatbotProvider } from "@/components/chatbot";
import HomepageSidebar from "@/components/HomepageSidebar";
import SocialMediaLinks from "@/components/mediapages/SocialMediaLinks";
import Layout from "@/components/layout/Layout";
import { X, Info } from "lucide-react";
import HeroCarousel from "@/components/hero/HeroCarousel";
import FeedsTab from "./tabs/feeds";
import CalendarTab from "./tabs/calendar";
import NewsletterTab from "./tabs/newsletter";
import PostsTab from "./tabs/posts";

export default function Home() {
  const [showWelcome, setShowWelcome] = useState(true);
  const [contentVisible, setContentVisible] = useState(false);
  const [currentTab, setCurrentTab] = useState("feed");
  const [logged, setLogged] = useState(false);
  const [isTabsSticky, setIsTabsSticky] = useState(false);
  const router = useRouter();
  const tabsRef = useRef<HTMLDivElement>(null);
  const tabsContainerRef = useRef<HTMLDivElement>(null);

  // Mock data objects
  const eventsData: EventsData = {
    success: true,
    data: [
      {
        "id": "clx1234567890abcdef",
        "title": "Company Annual Meeting",
        "description": "Annual company meeting for all employees",
        "startDate": "2024-12-25T09:00:00.000Z",
        "endDate": "2024-12-25T17:00:00.000Z",
        "location": "Main Conference Room",
        "authorId": "clx1234567890abcdef",
        "author": {
          "id": "clx1234567890abcdef",
          "firstName": "John",
          "lastName": "Doe",
          "email": "john@example.com"
        },
        "isActive": true,
        "createdAt": "2025-08-03T12:17:54.136Z",
        "updatedAt": "2025-08-03T12:17:54.136Z"
      }
    ]
  };


  useEffect(() => {
    const isSessionActive = sessionStorage.getItem('userID');
    if (isSessionActive) {
      setLogged(true);
      setShowWelcome(false);
      setContentVisible(true);
    } else {
      const timer = setTimeout(() => {
        setShowWelcome(true);
        setContentVisible(false);
      }, 3000);
      router.push('/auth')
      return () => clearTimeout(timer);
    }
  }, []);

  // Sticky tabs functionality
  useEffect(() => {
    const handleScroll = () => {
      if (tabsContainerRef.current) {
        const tabsContainer = tabsContainerRef.current;
        const rect = tabsContainer.getBoundingClientRect();
        const scrollContainer = tabsContainer.closest('.overflow-auto');
        
        if (scrollContainer) {
          // Check if tabs container top has reached the top of the scroll container
          const shouldBeSticky = rect.top <= 0;
          setIsTabsSticky(shouldBeSticky);
        }
      }
    };

    // Find the scroll container (the div with overflow-auto)
    const scrollContainer = document.querySelector('.overflow-auto');
    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', handleScroll);
      
      return () => {
        scrollContainer.removeEventListener('scroll', handleScroll);
      };
    }
  }, [logged]);

  const contentVariants: Variants = {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    visible: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: { 
        duration: 0.5,
        ease: [0.25, 0.46, 0.45, 0.94]
      }
    },
    exit: { 
      opacity: 0, 
      y: -20, 
      scale: 0.95,
      transition: { 
        duration: 0.3,
        ease: [0.25, 0.46, 0.45, 0.94]
      }
    }
  };

  const tabVariants: Variants = {
    inactive: { 
      scale: 1,
      transition: { duration: 0.2 }
    },
    active: { 
      scale: 1.05,
      transition: { duration: 0.2 }
    },
    hover: {
      scale: 1.02,
      transition: { duration: 0.2 }
    }
  };

  // Assuming TabsDemo is a component that uses the Tabs and TabsContent, TabsList, TabsTrigger components
  // and renders the actual content based on the currentTab. For this example, we'll create a placeholder.
  const TabsDemo = () => (
    <div className="text-foreground">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentTab}
          initial="hidden"
          animate="visible"
          exit="exit"
          variants={contentVariants}
        >
          {currentTab === "feed" && (
            <TabsContent value="feed">
              <FeedPage />
            </TabsContent>
          )}

          {currentTab === "newsletter" && (
            <TabsContent value="newsletter">
              <NewsletterCarousel />
            </TabsContent>
          )}

          {currentTab === "forum" && (
            <TabsContent value="forum">
              <Posts />
            </TabsContent>
          )}

          {currentTab === "calendar" && (
            <TabsContent value="calendar">
              <EventsCalendar events={eventsData} />
            </TabsContent>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );


  return (
    <Layout>
      <ChatbotProvider position="bottom-right">
        <div className="flex h-screen overflow-hidden bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-50">
          <HomepageSidebar />
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-auto">
              <main className="p-6">
                <div className="space-y-8">
                  {/* Hero Section with Animation */}
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                  >
                    <HeroClient />
                  </motion.div>
                  
                  {/* Tabs Section */}
                  <motion.div 
                    ref={tabsContainerRef} 
                    className="relative"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
                  >
                    <Tabs 
                      defaultValue="feed" 
                      className="w-full max-w-none"
                      onValueChange={(value) => setCurrentTab(value)}
                    >
                      <div className={`${isTabsSticky ? 'sticky top-0 z-50 pb-4 pt-4 bg-blue-50/80 backdrop-blur-md' : ''}`}>
                        {/* Tabs */}
                        <TabsList 
                          ref={tabsRef}
                          className="mb-8 grid w-full grid-cols-4 gap-2 sm:gap-3 rounded-xl border border-blue-200 bg-white p-1.5 sm:p-2 shadow-lg backdrop-blur"
                        >
                          {[
                            { id: 'feed', label: 'Feed' },
                            { id: 'newsletter', label: 'News' },
                            { id: 'forum', label: 'Forum' },
                            { id: 'calendar', label: 'Calendar' }
                          ].map((tab, index) => (
                            <TabsTrigger key={tab.id} value={tab.id} asChild>
                              <motion.button
                                className="group relative w-full overflow-hidden rounded-xl px-2 sm:px-4 py-3 text-base font-semibold text-blue-400 data-[state=active]:text-white focus:outline-none focus:ring-2 focus:ring-blue-300/50 transition-colors"
                                variants={tabVariants}
                                initial="inactive"
                                animate={currentTab === tab.id ? 'active' : 'inactive'}
                                whileHover="hover"
                                transition={{ delay: index * 0.1 }}
                              >
                                <span className="relative z-10 whitespace-nowrap text-center block">{tab.label}</span>
                                <span
                                  className="absolute inset-0 rounded-xl opacity-0 transition-opacity duration-300 group-data-[state=active]:opacity-100 bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-600"
                                />
                                <span className="pointer-events-none absolute inset-0 rounded-xl ring-1 ring-inset ring-blue-200 data-[state=active]:ring-blue-500/40" />
                              </motion.button>
                            </TabsTrigger>
                          ))}
                        </TabsList>
                      </div>

                      <div 
                        className="relative min-h-[300px] w-full rounded-xl border border-blue-200 p-6 shadow-xl bg-white backdrop-blur"
                      >
                        <TabsDemo />
                      </div>
                    </Tabs>
                  </motion.div>
                </div>
              </main>
            </div>
          </div>
        </div>
      </ChatbotProvider>
    </Layout>
  );
}