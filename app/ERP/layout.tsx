// @ts-nocheck
"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FiMenu,
  FiX,
  FiHome,
  FiDollarSign,
  FiFileText,
  FiChevronDown,
  FiTool,
} from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";

// --- Types ------------------------------------------------------
interface Role {
  id: string;
  name: string;
  description?: string;
  permissions?: { name: string; value: boolean }[];
}

interface UserResponse {
  success: boolean;
  data: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    createdAt: string;
    updatedAt: string;
    role: Role;
  };
}

export type MenuItem = {
  id: string;
  title: string;
  icon: React.ReactNode;
  path?: string;
  adminOnly?: boolean;
  subItems?: {
    id: string;
    title: string;
    path: string;
    adminOnly?: boolean;
  }[];
};

// --- Component --------------------------------------------------
const ERP = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();

  // UI state
  const [isMenuCollapsed, setIsMenuCollapsed] = useState<boolean>(false);
  const [expandedMenuItems, setExpandedMenuItems] = useState<string[]>([]);

  // Auth/role state
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [userLoading, setUserLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);

  // --- Persist collapse state ----------------------------------
  useEffect(() => {
    const stored = localStorage.getItem("erp.sidebar.collapsed");
    if (stored) setIsMenuCollapsed(stored === "1");
  }, []);
  useEffect(() => {
    localStorage.setItem("erp.sidebar.collapsed", isMenuCollapsed ? "1" : "0");
  }, [isMenuCollapsed]);

  // --- Fetch user role once ------------------------------------
  useEffect(() => {
    const controller = new AbortController();

    const fetchUserRole = async () => {
      try {
        setUserLoading(true);
        const token = sessionStorage.getItem("token");
        const userId = sessionStorage.getItem("userID");

        if (!token) {
          setAuthError("Authentication token not found");
          return;
        }
        if (!userId) {
          setAuthError("User ID not found in session");
          return;
        }

        const res = await fetch(
          `https://nvccz-pi.vercel.app/api/users/${userId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            signal: controller.signal,
          }
        );

        if (!res.ok) throw new Error(`Failed to fetch user data: ${res.status}`);

        const data: UserResponse = await res.json();
        if (data?.success && data?.data?.role?.name?.toLowerCase() === "admin") {
          setIsAdmin(true);
        }
      } catch (err: any) {
        if (err?.name !== "AbortError") {
          console.error("Error fetching user role:", err);
          setAuthError(err instanceof Error ? err.message : "Failed to verify user permissions");
        }
      } finally {
        setUserLoading(false);
      }
    };

    fetchUserRole();
    return () => controller.abort();
  }, []);

  // --- Menu model ----------------------------------------------
  const menuItems: MenuItem[] = useMemo(
    () => [
      {
        id: "Dashboard",
        title: "Dashboard",
        icon: <FiHome className="shrink-0" />,
        path: "/ERP/Dashboard",
      },
      {
        id: "Accounting",
        title: "Accounting",
        icon: <FiDollarSign className="shrink-0" />,
        subItems: [
          { id: "Expenses", title: "Expenses", path: "/ERP/Accounting/Expenses" },
          { id: "create-invoice", title: "Create Invoice", path: "/ERP/Invoices/Create", adminOnly: true },
          { id: "invoice-history", title: "Invoice History", path: "/ERP/Invoices/History" },
        ],
      },
      {
        id: "Reports",
        title: "Reports",
        icon: <FiFileText className="shrink-0" />,
        path: "/ERP/Reports",
        adminOnly: true,
      },
      {
        id: "Tools",
        title: "Tools",
        icon: <FiTool className="shrink-0" />,
        path: "/ERP/Tools",
        adminOnly: true,
      },
      {
        id: "Home",
        title: "Home",
        icon: <FiHome className="shrink-0" />,
        path: "/",
      },
    ],
    []
  );

  // --- Role-aware filtering (fixes original logic) --------------
  const filteredMenuItems = useMemo(() => {
    const filterItem = (item: MenuItem): MenuItem | null => {
      if (item.adminOnly && !isAdmin) return null;
      if (item.subItems?.length) {
        const filteredSubs = item.subItems.filter((s) => (s.adminOnly ? isAdmin : true));
        if (filteredSubs.length === 0) return null;
        return { ...item, subItems: filteredSubs };
      }
      return item;
    };

    return menuItems
      .map((i) => filterItem(i))
      .filter((i): i is MenuItem => i !== null);
  }, [menuItems, isAdmin]);

  // --- Helpers --------------------------------------------------
  const isActive = (path?: string) => !!path && (pathname === path || pathname.startsWith(`${path}/`));

  const toggleSubMenu = (menuId: string) => {
    setExpandedMenuItems((prev) =>
      prev.includes(menuId) ? prev.filter((id) => id !== menuId) : [...prev, menuId]
    );
  };

  // Auto-expand the group that contains the active route
  useEffect(() => {
    const toExpand = filteredMenuItems
      .filter((i) => i.subItems?.some((s) => isActive(s.path)))
      .map((i) => i.id);
    if (toExpand.length) setExpandedMenuItems((prev) => Array.from(new Set([...prev, ...toExpand])));
  }, [pathname, filteredMenuItems]);

  // --- UI -------------------------------------------------------
  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      {/* Sidebar */}
      <aside
        className={`relative border-r border-slate-200/60 bg-white/80 backdrop-blur-xl supports-[backdrop-filter]:bg-white/60 shadow-[0_8px_30px_rgb(2,6,23,0.06)] transition-[width] duration-300 ease-in-out ${
          isMenuCollapsed ? "w-[4.75rem]" : "w-64"
        } flex flex-col`}
      >
        {/* Brand + Collapse */}
        <div className="flex items-center justify-between px-3 py-3 border-b border-slate-200/60">
          {!isMenuCollapsed ? (
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-indigo-600 to-sky-500 shadow-sm" />
              <div className="leading-tight">
                <p className="text-sm font-semibold tracking-tight text-slate-800">NVCCZ</p>
                <p className="text-[11px] text-slate-500 -mt-0.5">Accounting</p>
              </div>
            </div>
          ) : (
            <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-indigo-600 to-sky-500 shadow-sm" />
          )}

          <button
            aria-label={isMenuCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            onClick={() => setIsMenuCollapsed((v) => !v)}
            className="p-2 rounded-lg hover:bg-slate-100 active:scale-95 transition"
          >
            {isMenuCollapsed ? <FiMenu size={18} /> : <FiX size={18} />}
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-2 py-3">
          {filteredMenuItems.map((item) => {
            const activeTop = item.path && isActive(item.path);
            const isGroupActive = item.subItems?.some((s) => isActive(s.path));
            const expanded = expandedMenuItems.includes(item.id);

            // Single-link item
            if (item.path && !item.subItems) {
              return (
                <Link key={item.id} href={item.path} title={isMenuCollapsed ? item.title : undefined}>
                  <motion.div
                    whileHover={{ x: isMenuCollapsed ? 0 : 4 }}
                    className={`group relative mb-1.5 flex items-center rounded-xl px-3 py-2 text-sm transition-all ${
                      activeTop
                        ? "bg-white shadow-sm ring-1 ring-slate-200 text-slate-900"
                        : "text-slate-600 hover:bg-white/80 hover:shadow-sm"
                    }`}
                  >
                    <span className={`mr-3 grid h-8 w-8 place-items-center rounded-lg border ${
                        activeTop
                          ? "border-indigo-200 bg-indigo-50 text-indigo-600"
                          : "border-slate-200 bg-white text-slate-500 group-hover:border-slate-300"
                      }`}>
                      {item.icon}
                    </span>
                    {!isMenuCollapsed && (
                      <span className="truncate font-medium tracking-tight">{item.title}</span>
                    )}

                    {/* Active indicator */}
                    {activeTop && (
                      <motion.span
                        layoutId="active-dot"
                        className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-r bg-indigo-500"
                      />
                    )}
                  </motion.div>
                </Link>
              );
            }

            // Group item
            return (
              <div key={item.id} className="mb-1.5">
                <button
                  type="button"
                  onClick={() => toggleSubMenu(item.id)}
                  aria-expanded={expanded}
                  className={`group relative flex w-full items-center rounded-xl px-3 py-2 text-left text-sm transition-colors ${
                    isGroupActive
                      ? "bg-white shadow-sm ring-1 ring-slate-200 text-slate-900"
                      : "text-slate-600 hover:bg-white/80 hover:shadow-sm"
                  } ${isMenuCollapsed ? "justify-center" : "justify-between"}`}
                  title={isMenuCollapsed ? item.title : undefined}
                >
                  <div className="flex items-center">
                    <span className={`mr-3 grid h-8 w-8 place-items-center rounded-lg border ${
                        isGroupActive
                          ? "border-indigo-200 bg-indigo-50 text-indigo-600"
                          : "border-slate-200 bg-white text-slate-500 group-hover:border-slate-300"
                      }`}>
                      {item.icon}
                    </span>
                    {!isMenuCollapsed && (
                      <span className="truncate font-medium tracking-tight">{item.title}</span>
                    )}
                  </div>
                  {!isMenuCollapsed && (
                    <FiChevronDown
                      className={`transition-transform ${expanded ? "rotate-180" : "rotate-0"}`}
                      size={16}
                    />)
                  }

                  {isGroupActive && (
                    <motion.span
                      layoutId="active-dot"
                      className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-r bg-indigo-500"
                    />
                  )}
                </button>

                {/* Submenu */}
                <AnimatePresence initial={false}>
                  {!isMenuCollapsed && expanded && item.subItems && (
                    <motion.ul
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ type: "tween", duration: 0.2 }}
                      className="ml-11 mt-1 space-y-1 overflow-hidden"
                    >
                      {item.subItems.map((sub) => {
                        const active = isActive(sub.path);
                        return (
                          <li key={sub.id}>
                            <Link href={sub.path} className="block">
                              <motion.div
                                whileHover={{ x: 6 }}
                                className={`relative rounded-lg px-2 py-1.5 text-[13px] transition-all ${
                                  active
                                    ? "bg-white text-slate-900 shadow-sm ring-1 ring-slate-200"
                                    : "text-slate-600 hover:bg-white/70"
                                }`}
                              >
                                <span className="font-medium tracking-tight">{sub.title}</span>
                                {active && (
                                  <motion.span
                                    layoutId="active-sub"
                                    className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-1 rounded-r bg-indigo-500"
                                  />
                                )}
                              </motion.div>
                            </Link>
                          </li>
                        );
                      })}
                    </motion.ul>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </nav>

        {/* Footer / Status */}
        <div className="border-t border-slate-200/60 p-3 text-[11px] text-slate-500">
          {userLoading ? (
            <span className="inline-flex items-center gap-2">
              <span className="h-2 w-2 animate-pulse rounded-full bg-slate-300" /> Loading user…
            </span>
          ) : authError ? (
            <span className="text-rose-600">{authError}</span>
          ) : (
            <span className="inline-flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              {isAdmin ? "Admin" : "Standard"} access
            </span>
          )}
        </div>
      </aside>

      {/* Main content */}
      <section className="flex-1 overflow-auto">
        <header className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-slate-200/60 bg-white/80 px-4 py-3 backdrop-blur-xl">
          <h2 className="text-xl font-semibold tracking-tight text-slate-800">
            {/* Breadcrumb-like header */}
            {(() => {
              const top = filteredMenuItems.find((i) => i.path && isActive(i.path));
              const sub = filteredMenuItems.flatMap((i) => i.subItems || []).find((s) => isActive(s.path));
              if (top) return top.title;
              if (sub) {
                const parent = filteredMenuItems.find((i) => i.subItems?.some((s) => s.id === sub.id));
                return parent ? `${parent.title} / ${sub.title}` : sub.title;
              }
              return "";
            })()}
          </h2>

          {/* Quick collapse toggle for large screens */}
          <button
            onClick={() => setIsMenuCollapsed((v) => !v)}
            className="hidden sm:inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 shadow-sm hover:bg-slate-50 active:scale-95"
          >
            {isMenuCollapsed ? <FiMenu /> : <FiX />} <span>Sidebar</span>
          </button>
        </header>

        <main className="min-h-[calc(100vh-56px)] bg-gradient-to-b from-white to-slate-50 p-6">
          {children}
        </main>
      </section>
    </div>
  );
};

export default ERP;
