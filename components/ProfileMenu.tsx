"use client"

import { User, Settings, LogOut, Building2, LayoutDashboard, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";

interface UserData {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  createdAt: string;
  updatedAt: string;
  role: {
    id: string;
    name: string;
    description: string;
    permissions: {
      name: string;
      value: boolean;
    }[];
  };
}

interface UserResponse {
  success: boolean;
  data: UserData;
}

export default function ProfileMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, right: 0 });
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);

  // Fetch user on mount
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        const token = sessionStorage.getItem("token");
        const userId = sessionStorage.getItem("userID");

        if (!token || !userId) {
          throw new Error("Authentication data not found");
        }

        const response = await fetch(`https://nvccz-pi.vercel.app/api/users/${userId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch user data: ${response.status}`);
        }

        const data: UserResponse = await response.json();
        if (data.success) {
          setUserData(data.data);
        }
      } catch (err) {
        // Silently handle auth errors - don't show error to user
        console.error("Error fetching user data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (!isOpen) return;
      const target = e.target as Node;
      const dropdown = document.getElementById('profile-menu');
      
      // Don't close if clicking on the button or inside the dropdown
      if (
        (containerRef.current && containerRef.current.contains(target)) ||
        (dropdown && dropdown.contains(target))
      ) {
        return;
      }
      
      setIsOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  // Close on ESC
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, []);

  // Update position on window resize
  useEffect(() => {
    const handleResize = () => {
      if (isOpen) {
        updateDropdownPosition();
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isOpen]);

  const handleSignOut = () => {
    sessionStorage.clear();
    router.push("/auth");
  };

  const updateDropdownPosition = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + 8, // 8px gap below button
        right: window.innerWidth - rect.right, // Distance from right edge
      });
    }
  };

  const toggleDropdown = () => {
    if (!isOpen) {
      updateDropdownPosition();
    }
    setIsOpen((o) => !o);
  };

  if (loading) {
    return (
      <div className="relative">
        <div className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-input bg-background/60">
          <div className="w-4 h-4 rounded-full border-2 border-gray-300 border-t-transparent animate-spin" />
        </div>
      </div>
    );
  }

  // If no user data and error, show a simple user icon without dropdown
  if (!userData && error) {
    return (
      <div className="relative">
        <div className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-input bg-background/60 text-foreground">
          <User className="w-4 h-4" />
        </div>
      </div>
    );
  }

  const initials = userData ? `${userData.firstName?.charAt(0) ?? ""}${userData.lastName?.charAt(0) ?? ""}` : "U";
  const fullName = userData ? `${userData.firstName} ${userData.lastName}` : "User";

  return (
    <div className="relative inline-block" ref={containerRef}>
      {/* Trigger */}
      <button
        ref={buttonRef}
        onClick={toggleDropdown}
        aria-haspopup="true"
        aria-expanded={isOpen}
        aria-label="Account menu"
        className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-input bg-background/60 text-foreground hover:bg-accent focus:outline-none focus:ring-2 focus:ring-ring/50"
      >
        <User className="w-4 h-4" />
      </button>

      {/* Dropdown */}
      {isOpen && typeof window !== 'undefined' && createPortal(
        <div
          id="profile-menu"
          role="menu"
          aria-orientation="vertical"
          className="fixed w-72 origin-top-right z-[9999] rounded-lg bg-gray-900/95 backdrop-blur supports-[backdrop-filter]:bg-gray-900/80 border border-gray-700 shadow-xl ring-1 ring-black/5"
          style={{
            top: `${dropdownPosition.top}px`,
            right: `${dropdownPosition.right}px`,
          }}
        >
          {/* User summary */}
          <div className="px-4 py-3 border-b border-gray-700">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-indigo-600 to-fuchsia-600 text-white font-semibold">
                {initials}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-white truncate">{fullName}</p>
                <p className="text-xs text-gray-400 truncate" title={userData?.email}>{userData?.email ?? ""}</p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="py-2">
            <button
              onClick={() => {
                setShowProfileModal(true);
                setIsOpen(false);
              }}
              className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-300 hover:bg-gray-800/70 hover:text-white focus:bg-gray-800/70 focus:text-white transition-colors"
              role="menuitem"
            >
              <User className="h-4 w-4" />
              View profile
            </button>

            <a
              href="/ERP"
              className="flex items-center gap-3 px-4 py-2 text-sm text-gray-300 hover:bg-gray-800/70 hover:text-white transition-colors"
              role="menuitem"
            >
              <LayoutDashboard className="h-4 w-4" />
              Dashboard
            </a>

            <a
              href="/organization"
              className="flex items-center gap-3 px-4 py-2 text-sm text-gray-300 hover:bg-gray-800/70 hover:text-white transition-colors"
              role="menuitem"
            >
              <Building2 className="h-4 w-4" />
              Organization settings
            </a>

            <a
              href="/settings"
              className="flex items-center gap-3 px-4 py-2 text-sm text-gray-300 hover:bg-gray-800/70 hover:text-white transition-colors"
              role="menuitem"
            >
              <Settings className="h-4 w-4" />
              Account settings
            </a>

            <div className="my-2 border-t border-gray-700" />

            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-300 hover:bg-red-500/10 hover:text-red-200 focus:bg-red-500/10 transition-colors"
              role="menuitem"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </div>
        </div>,
        document.body
      )}

      {/* Profile Modal */}
      {showProfileModal && userData && (
        <div className="fixed inset-0 z-[9999] bg-black/50 flex items-center justify-center p-4">
          <div className="bg-gray-900/95 backdrop-blur supports-[backdrop-filter]:bg-gray-900/80 rounded-lg max-w-md w-full border border-gray-700 shadow-2xl">
            <div className="flex justify-between items-center p-4 border-b border-gray-700">
              <h3 className="text-lg font-medium text-white">Profile Information</h3>
              <button onClick={() => setShowProfileModal(false)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <div className="flex items-center space-x-4 mb-6">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-600 to-fuchsia-600 flex items-center justify-center text-white text-2xl font-semibold">
                  {initials}
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-white">{fullName}</h2>
                  <p className="text-gray-400">{userData.email}</p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-400 mb-1">Role</h4>
                  <p className="text-white capitalize">{userData.role.name}</p>
                  <p className="text-gray-400 text-sm mt-1">{userData.role.description}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-400 mb-1">Member Since</h4>
                  <p className="text-white">
                    {new Date(userData.createdAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-400 mb-2">Permissions</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {userData.role.permissions
                      .filter((p) => p.value)
                      .map((p) => (
                        <div key={p.name} className="bg-gray-800/70 rounded px-3 py-1.5 text-sm text-gray-200">
                          {p.name.replace(/_/g, " ")}
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="p-4 border-t border-gray-700 flex justify-end gap-2">
              <button
                onClick={() => setShowProfileModal(false)}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-md transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      
    </div>
  );
}
