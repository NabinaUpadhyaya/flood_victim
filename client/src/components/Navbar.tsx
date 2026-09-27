'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { Shield, FileText, LayoutDashboard, PlusCircle, Users, LogOut, LogIn, Menu, X, CheckCircle2 } from 'lucide-react';
import { getStoredUser, clearAuthSession } from '@/services/api';
import { User } from '@/types';

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    setUser(getStoredUser());
  }, [pathname]);

  const handleLogout = () => {
    clearAuthSession();
    setUser(null);
    router.push('/login');
  };

  const isActive = (path: string) => pathname === path;

  return (
    <nav className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#D8E2E8] shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18">
          
          {/* Brand Logo & Name */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="text-xl font-extrabold tracking-tight text-[#123B5D]">
                  अनौपचारिक क्षेत्र सेवा केन्द्र (इन्सेक)
                </span>
              </div>
              <span className="text-xs text-[#64748B] font-medium">
                व्यक्तिगत घटना तथा प्रभावित व्यक्ति तथ्याङ्क संकलन फारम
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-1.5 lg:gap-2">
            {user ? (
              <>
                <Link
                  href="/dashboard"
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive('/dashboard')
                      ? 'bg-[#DFF5F2] text-[#0F766E] font-semibold'
                      : 'text-[#64748B] hover:text-[#123B5D] hover:bg-[#E8F3F6]'
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span>ड्यासबोर्ड</span>
                </Link>

                {user.role !== 'viewer' && (
                  <Link
                    href="/dashboard/new"
                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive('/dashboard/new')
                        ? 'bg-[#DFF5F2] text-[#0F766E] font-semibold'
                        : 'text-[#64748B] hover:text-[#123B5D] hover:bg-[#E8F3F6]'
                    }`}
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>रेकर्ड थप्नुहोस्</span>
                  </Link>
                )}

                {user.role === 'admin' && (
                  <Link
                    href="/dashboard/users"
                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive('/dashboard/users')
                        ? 'bg-[#DFF5F2] text-[#0F766E] font-semibold'
                        : 'text-[#64748B] hover:text-[#123B5D] hover:bg-[#E8F3F6]'
                    }`}
                  >
                    <Users className="w-4 h-4" />
                    <span>प्रयोगकर्ता व्यवस्थापन</span>
                  </Link>
                )}
              </>
            ) : null}
          </div>

          {/* User Auth Info / Actions */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3 pl-3 border-l border-[#D8E2E8]">
                <div className="flex flex-col text-right">
                  <div className="flex items-center gap-1.5 justify-end">
                    <span className="text-sm font-bold text-[#1E293B] leading-tight">
                      {user.name}
                    </span>
                    <span
                      className={`text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                        user.role === 'admin'
                          ? 'bg-[#123B5D]/10 text-[#123B5D] border-[#123B5D]/20'
                          : user.role === 'viewer'
                          ? 'bg-[#E8F3F6] text-[#64748B] border-[#D8E2E8]'
                          : 'bg-[#DFF5F2] text-[#0F766E] border-[#0F766E]/20'
                      }`}
                    >
                      {user.role === 'admin' ? 'प्रशासक' : user.role === 'viewer' ? 'दर्शक (Viewer)' : 'सम्पादक'}
                    </span>
                  </div>
                  <span className="text-xs text-[#64748B] font-mono">
                    {user.email}
                  </span>
                </div>

                <button
                  onClick={handleLogout}
                  title="लगआउट गर्नुहोस्"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-[#DC2626] hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>लगआउट</span>
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-[#176B87] hover:bg-[#123B5D] text-white shadow-sm hover:shadow transition-all"
              >
                <LogIn className="w-4 h-4" />
                <span>कर्मचारी लगइन (Staff Login)</span>
              </Link>
            )}
          </div>

          {/* Mobile hamburger button */}
          <div className="flex md:hidden items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-[#64748B] hover:text-[#1E293B] hover:bg-[#E8F3F6]"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-[#D8E2E8] bg-white px-4 pt-3 pb-5 space-y-2 shadow-lg">
          <Link
            href="/"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-base font-medium text-[#1E293B] hover:bg-[#E8F3F6]"
          >
            <FileText className="w-5 h-5 text-[#176B87]" />
            <span>सार्वजनिक संकलन फारम</span>
          </Link>

          {user ? (
            <>
              <Link
                href="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-base font-medium text-[#1E293B] hover:bg-[#E8F3F6]"
              >
                <LayoutDashboard className="w-5 h-5 text-[#176B87]" />
                <span>ड्यासबोर्ड (Dashboard)</span>
              </Link>

              {user.role !== 'viewer' && (
                <Link
                  href="/dashboard/new"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-base font-medium text-[#1E293B] hover:bg-[#E8F3F6]"
                >
                  <PlusCircle className="w-5 h-5 text-[#176B87]" />
                  <span>नयाँ रेकर्ड थप्नुहोस् (+ New)</span>
                </Link>
              )}

              {user.role === 'admin' && (
                <Link
                  href="/dashboard/users"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-base font-medium text-[#1E293B] hover:bg-[#E8F3F6]"
                >
                  <Users className="w-5 h-5 text-[#176B87]" />
                  <span>प्रयोगकर्ता व्यवस्थापन (Users)</span>
                </Link>
              )}

              <div className="pt-3 border-t border-[#D8E2E8]/60 flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-[#1E293B]">{user.name}</p>
                  <p className="text-xs text-[#64748B]">{user.email} ({user.role})</p>
                </div>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleLogout();
                  }}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-semibold text-[#DC2626] bg-rose-50"
                >
                  <LogOut className="w-4 h-4" />
                  <span>लगआउट</span>
                </button>
              </div>
            </>
          ) : (
            <div className="pt-2">
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-lg text-sm font-semibold bg-[#176B87] text-white"
              >
                <LogIn className="w-4 h-4" />
                <span>कर्मचारी लगइन (Staff Login)</span>
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
