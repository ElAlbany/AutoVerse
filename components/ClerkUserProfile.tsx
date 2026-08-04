"use client";

import { UserProfile } from "@clerk/nextjs";
import { useEffect, useState } from "react";

export default function ClerkUserProfile() {
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    const checkTheme = () => {
      setIsDark(document.documentElement.classList.contains("dark"));
    };
    checkTheme();
    // Watch for class changes on html element
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  const appearance = {
    elements: {
      rootBox: "w-full",
      card: isDark
        ? "shadow-none border-0 w-full bg-transparent"
        : "shadow-none border-0 w-full bg-transparent",
      navbar: isDark
        ? "border-r border-dark-border bg-dark-surface"
        : "border-r border-gray-100 bg-gray-50",
      navbarButton: isDark
        ? "text-sm font-medium text-gray-300 hover:text-white hover:bg-white/5"
        : "text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100",
      navbarButtonActive: isDark
        ? "bg-primary-blue text-white"
        : "bg-primary-blue text-white",
      headerTitle: isDark ? "text-gray-100" : "text-gray-900",
      headerSubtitle: isDark ? "text-gray-400" : "text-gray-500",
      profileSectionTitle: isDark ? "text-gray-100" : "text-gray-900",
      profileSectionSubtitle: isDark ? "text-gray-400" : "text-gray-500",
      profileSectionContent: isDark ? "text-gray-300" : "text-gray-700",
      formFieldLabel: isDark ? "text-gray-300" : "text-gray-700",
      formFieldInput: isDark
        ? "bg-dark-surface border-dark-border text-gray-100 rounded-xl"
        : "bg-gray-50 border-gray-200 text-gray-900 rounded-xl",
      formFieldInputPlaceholder: isDark ? "text-gray-500" : "text-gray-400",
      accordionTriggerButton: isDark
        ? "text-gray-300 hover:bg-white/5"
        : "text-gray-700 hover:bg-gray-50",
      accordionContent: isDark ? "text-gray-400" : "text-gray-600",
      button: isDark
        ? "bg-primary-blue hover:bg-blue-600 text-white rounded-xl"
        : "bg-primary-blue hover:bg-blue-700 text-white rounded-xl",
      badge: isDark
        ? "bg-primary-blue/20 text-accent-cyan border border-primary-blue/30"
        : "bg-primary-blue/10 text-primary-blue border border-primary-blue/20",
      identityPreviewText: isDark ? "text-gray-300" : "text-gray-700",
      identityPreviewEditButton: isDark
        ? "text-accent-cyan hover:text-accent-cyan/80"
        : "text-primary-blue hover:text-primary-blue/80",
      formButtonPrimary: isDark
        ? "bg-primary-blue hover:bg-blue-600 text-white rounded-xl"
        : "bg-primary-blue hover:bg-blue-700 text-white rounded-xl",
      formButtonReset: isDark
        ? "text-gray-400 hover:text-gray-200"
        : "text-gray-500 hover:text-gray-700",
      otpCodeFieldInput: isDark
        ? "bg-dark-surface border-dark-border text-gray-100 rounded-xl"
        : "bg-gray-50 border-gray-200 text-gray-900 rounded-xl",
      page: isDark ? "bg-transparent" : "bg-transparent",
      scrollBox: isDark ? "bg-transparent" : "bg-transparent",
      activeDeviceListItem: isDark
        ? "border-b border-dark-border hover:bg-white/5"
        : "border-b border-gray-100 hover:bg-gray-50",
      activeDeviceListItemTitle: isDark ? "text-gray-100" : "text-gray-900",
      activeDeviceListItemDetails: isDark ? "text-gray-400" : "text-gray-500",
      activeDeviceListItemActions: isDark ? "text-accent-cyan" : "text-primary-blue",
      mfaTOTPButton: isDark
        ? "bg-dark-surface border-dark-border text-gray-100 hover:bg-white/5"
        : "bg-gray-50 border-gray-200 text-gray-900 hover:bg-gray-100",
      providerIcon: "filter-none",
    },
    variables: {
      colorPrimary: "#2B59FF",
      colorBackground: isDark ? "transparent" : "transparent",
      colorText: isDark ? "#f1f5f9" : "#0f172a",
      colorTextSecondary: isDark ? "#94a3b8" : "#64748b",
      colorInputBackground: isDark ? "#111827" : "#f8fafc",
      colorInputText: isDark ? "#f1f5f9" : "#0f172a",
      colorAlphaShade: isDark ? "#ffffff" : "#000000",
      borderRadius: "12px",
      fontFamily: "Manrope, sans-serif",
    },
  };

  return <UserProfile routing="hash" appearance={appearance} />;
}
