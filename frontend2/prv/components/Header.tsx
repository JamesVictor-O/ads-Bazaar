import React, { useState } from "react";
import { Bell, Menu, User } from "lucide-react";

interface HeaderProps {
  setActiveTab: (tab: string) => void;
}

const Header: React.FC<HeaderProps> = ({ setActiveTab }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  return (
    <div>
      <header className="bg-indigo-700 text-white shadow-md">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className="bg-white rounded-full p-1">
              <div className="h-8 w-8 rounded-full bg-indigo-500 flex items-center justify-center">
                <span className="font-bold text-white">AB</span>
              </div>
            </div>
            <h1 className="text-xl font-bold">Ads-Bazer</h1>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <a
              href="#"
              className="font-medium hover:text-indigo-200 transition"
              onClick={() => setActiveTab("dashboard")}
            >
              Dashboard
            </a>
            <a
              href="#"
              className="font-medium hover:text-indigo-200 transition"
              onClick={() => setActiveTab("marketplace")}
            >
              Marketplace
            </a>
            <a
              href="#"
              className="font-medium hover:text-indigo-200 transition"
              onClick={() => setActiveTab("campaigns")}
            >
              Campaigns
            </a>
            <a
              href="#"
              className="font-medium hover:text-indigo-200 transition"
              onClick={() => setActiveTab("analytics")}
            >
              Analytics
            </a>
          </nav>

          <div className="flex items-center space-x-4">
            <button className="text-white hover:text-indigo-200 transition">
              <Bell size={20} />
            </button>
            <div className="relative">
              <button className="flex items-center space-x-2">
                <div className="h-8 w-8 rounded-full bg-indigo-800 flex items-center justify-center">
                  <User size={18} />
                </div>
              </button>
            </div>

            {/* Mobile menu button */}
            <button
              className="md:hidden text-white"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <Menu size={24} />
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-indigo-800 py-2">
            <nav className="container mx-auto px-4 flex flex-col space-y-2">
              <a
                href="#"
                className="py-2 font-medium hover:text-indigo-200 transition"
                onClick={() => {
                  setActiveTab("dashboard");
                  setMobileMenuOpen(false);
                }}
              >
                Dashboard
              </a>
              <a
                href="#"
                className="py-2 font-medium hover:text-indigo-200 transition"
                onClick={() => {
                  setActiveTab("marketplace");
                  setMobileMenuOpen(false);
                }}
              >
                Marketplace
              </a>
              <a
                href="#"
                className="py-2 font-medium hover:text-indigo-200 transition"
                onClick={() => {
                  setActiveTab("campaigns");
                  setMobileMenuOpen(false);
                }}
              >
                Campaigns
              </a>
              <a
                href="#"
                className="py-2 font-medium hover:text-indigo-200 transition"
                onClick={() => {
                  setActiveTab("analytics");
                  setMobileMenuOpen(false);
                }}
              >
                Analytics
              </a>
            </nav>
          </div>
        )}
      </header>
    </div>
  );
};

export default Header;
