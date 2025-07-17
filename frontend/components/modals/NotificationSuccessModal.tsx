"use client";

import { motion } from "framer-motion";
import { X, Bell, CheckCircle, Users, Briefcase, Clock, DollarSign, AlertTriangle } from "lucide-react";

interface NotificationSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  userType: 'influencer' | 'brand' | 'unknown';
}

export function NotificationSuccessModal({ isOpen, onClose, userType }: NotificationSuccessModalProps) {
  if (!isOpen) return null;

  const getContent = () => {
    switch (userType) {
      case 'influencer':
        return {
          title: "🎉 Notifications Enabled!",
          subtitle: "You'll now receive updates for influencer activities",
          benefits: [
            {
              icon: <Users className="w-5 h-5 text-blue-400" />,
              title: "Campaign Opportunities",
              description: "Get notified about new campaigns matching your audience and interests"
            },
            {
              icon: <CheckCircle className="w-5 h-5 text-green-400" />,
              title: "Application Updates",
              description: "Know instantly when you're selected for campaigns or need to take action"
            },
            {
              icon: <DollarSign className="w-5 h-5 text-emerald-400" />,
              title: "Payment Alerts",
              description: "Receive notifications when payments are ready or processed"
            },
            {
              icon: <Clock className="w-5 h-5 text-amber-400" />,
              title: "Deadline Reminders",
              description: "Never miss content submission deadlines with timely reminders"
            }
          ],
          footerText: "Start exploring campaigns and building your influencer portfolio!"
        };
      
      case 'brand':
        return {
          title: "🚀 Notifications Enabled!",
          subtitle: "You'll now receive updates for brand activities",
          benefits: [
            {
              icon: <Users className="w-5 h-5 text-blue-400" />,
              title: "Application Alerts",
              description: "Get notified when influencers apply to your campaigns"
            },
            {
              icon: <CheckCircle className="w-5 h-5 text-green-400" />,
              title: "Content Submissions",
              description: "Know when influencers submit proof of work for review"
            },
            {
              icon: <AlertTriangle className="w-5 h-5 text-amber-400" />,
              title: "Campaign Deadlines",
              description: "Receive warnings about campaign expiry and important dates"
            },
            {
              icon: <Briefcase className="w-5 h-5 text-purple-400" />,
              title: "Campaign Management",
              description: "Stay updated on low applications, budget refunds, and more"
            }
          ],
          footerText: "Ready to create your first campaign and connect with influencers!"
        };
      
      default:
        return {
          title: "🔔 Notifications Enabled!",
          subtitle: "You'll receive updates about your activities",
          benefits: [
            {
              icon: <Bell className="w-5 h-5 text-blue-400" />,
              title: "Activity Updates",
              description: "Get notified about important platform activities"
            },
            {
              icon: <CheckCircle className="w-5 h-5 text-green-400" />,
              title: "Status Changes",
              description: "Know when your applications or campaigns change status"
            },
            {
              icon: <DollarSign className="w-5 h-5 text-emerald-400" />,
              title: "Payment Notifications",
              description: "Receive alerts about payment-related activities"
            },
            {
              icon: <Clock className="w-5 h-5 text-amber-400" />,
              title: "Reminders",
              description: "Get timely reminders for important deadlines"
            }
          ],
          footerText: "Explore the platform and start your journey!"
        };
    }
  };

  const content = getContent();

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-slate-800 rounded-2xl border border-slate-700/50 shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-700/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/20 rounded-lg">
                <Bell className="w-6 h-6 text-green-400" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">
                  {content.title}
                </h2>
                <p className="text-sm text-slate-400 mt-1">
                  {content.subtitle}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="space-y-4">
            {content.benefits.map((benefit, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-start gap-3 p-3 bg-slate-900/50 rounded-lg border border-slate-700/30"
              >
                <div className="flex-shrink-0 mt-0.5">
                  {benefit.icon}
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-white mb-1">
                    {benefit.title}
                  </h3>
                  <p className="text-sm text-slate-400 leading-relaxed">
                    {benefit.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Footer */}
          <div className="mt-6 p-4 bg-gradient-to-r from-emerald-500/10 to-blue-500/10 rounded-lg border border-emerald-500/20">
            <p className="text-sm text-center text-slate-300">
              {content.footerText}
            </p>
          </div>
        </div>

        {/* Action Button */}
        <div className="p-6 border-t border-slate-700/50">
          <button
            onClick={onClose}
            className="w-full px-4 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-semibold rounded-lg hover:from-emerald-600 hover:to-emerald-700 transition-all duration-200 shadow-lg shadow-emerald-500/20"
          >
            Get Started
          </button>
        </div>
      </motion.div>
    </div>
  );
}