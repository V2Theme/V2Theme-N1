const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "/api/v1";

function resolveSecurityBaseUrl() {
  try {
    return new URL(apiBaseUrl).origin;
  } catch {
    return "/";
  }
}

export const appConfig = {
  title: import.meta.env.VITE_SITE_NAME ?? "Example",
  description: "面向 V2Board / KXBoard 用户中心的现代化 SaaS 主题。",
  panelType: import.meta.env.VITE_PANEL_TYPE ?? "v2board",
  apiBaseUrl,
  securityEnabled: import.meta.env.VITE_SECURITY_ENABLED === "true",
  securityBaseUrl: resolveSecurityBaseUrl(),
  securityPathPrefix: import.meta.env.VITE_SECURITY_PATH_PREFIX ?? "/api/v1",
  encryptPassword: import.meta.env.VITE_SECURITY_PASSWORD ?? "",
  encryptResponse: true,
  footerLinks: [
    {
      label: import.meta.env.VITE_FOOTER_LINK_1_LABEL ?? "Terms",
      url: import.meta.env.VITE_FOOTER_LINK_1_URL ?? "#",
    },
    {
      label: import.meta.env.VITE_FOOTER_LINK_2_LABEL ?? "Privacy",
      url: import.meta.env.VITE_FOOTER_LINK_2_URL ?? "#",
    },
  ],
  clientDownloads: [
    { label: "iOS", url: import.meta.env.VITE_CLIENT_DOWNLOAD_IOS ?? "#" },
    { label: "Android", url: import.meta.env.VITE_CLIENT_DOWNLOAD_ANDROID ?? "#" },
    { label: "macOS", url: import.meta.env.VITE_CLIENT_DOWNLOAD_MACOS ?? "#" },
    { label: "Windows", url: import.meta.env.VITE_CLIENT_DOWNLOAD_WINDOWS ?? "#" },
    { label: "Linux", url: import.meta.env.VITE_CLIENT_DOWNLOAD_LINUX ?? "#" },
  ],
};

export const navItems = [
  { label: "仪表盘", to: "/dashboard" },
  { label: "订阅", to: "/subscription" },
  { label: "套餐", to: "/plans" },
  { label: "订单", to: "/orders" },
  { label: "工单", to: "/tickets" },
  { label: "邀请返利", to: "/invite" },
  { label: "钱包", to: "/wallet" },
  { label: "节点", to: "/nodes" },
  { label: "公告", to: "/notices" },
  { label: "文档", to: "/docs" },
  { label: "设置", to: "/settings" },
];
