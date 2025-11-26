// src/theme.ts
import type { ThemeConfig } from "antd";

export const themeTokens: ThemeConfig = {
  token: {
    // ===== 品牌色 =====
    colorPrimary: "#3B82F6", // 蓝色 
    colorPrimaryHover: "#2563EB",
    colorPrimaryActive: "#1D4ED8",

    // ===== 状态色 =====
    colorSuccess: "#10B981", // 绿色 - 可配送地址
    colorWarning: "#F59E0B", // 橙色 - 时效风险地址
    colorError: "#EF4444", // 红色 - 范围外地址

    // ===== 文本 =====
    colorText: "#1F2937", // 深灰色文本
    colorTextSecondary: "#6B7280", // 次要文本
    colorTextDisabled: "rgba(0, 0, 0, 0.25)",

    // ===== 背景 =====
    colorBgLayout: "#F9FAFB", // 浅灰背景
    colorBgContainer: "#FFFFFF", // 白色容器背景

    // ===== 边框 =====
    colorBorder: "#E5E7EB", // 浅灰边框
    colorBorderSecondary: "#D1D5DB", // 次要边框

    // ===== 规格 =====
    borderRadius: 8,
    wireframe: false, // 保持 AntD 默认风格
  },

  // ===== 组件级样式 =====
  components: {
    Button: {
      borderRadius: 8,
      controlHeight: 40,
      fontSize: 16,

      // 主按钮（蓝色主题）
      colorPrimary: "#3B82F6",
      colorPrimaryHover: "#2563EB",
      colorPrimaryActive: "#1D4ED8",

      // 成功按钮（绿色）
      colorSuccess: "#10B981",
      colorSuccessHover: "#059669",
      colorSuccessActive: "#047857",

      // 警告按钮（橙色）
      colorWarning: "#F59E0B",
      colorWarningHover: "#D97706",
      colorWarningActive: "#B45309",

      // 错误按钮（红色）
      colorError: "#EF4444",
      colorErrorHover: "#DC2626",
      colorErrorActive: "#B91C1C",

      // 禁用
      colorBgContainerDisabled: "#F3F4F6",
      colorTextDisabled: "rgba(0,0,0,0.25)",
    },

    Input: {
      borderRadius: 8,
      activeShadow: "0 0 0 2px rgba(59,130,246,0.2)", // 蓝色焦点阴影
      hoverBorderColor: "#3B82F6",
      controlHeight: 40,
    },

    Card: {
      borderRadius: 12,
      paddingLG: 24,
    },

    Badge: {
      // 状态徽章颜色
      colorSuccess: "#10B981",
      colorWarning: "#F59E0B",
      colorError: "#EF4444",
    },

    Menu: {
      borderRadius: 8,
      itemBorderRadius: 8,
      itemMarginInline: 0,
      itemMarginBlock: 4,
      itemPaddingInline: 12,
      itemActiveBg: "#D1D5DB",
      itemHoverBg: "#E5E7EB",
      itemSelectedBg: "#D1D5DB",
      itemSelectedColor: "#1F2937",
      subMenuItemBorderRadius: 8,
    },

    Layout: {
      siderBg: "#F3F4F6",
    },

    Tag: {
      borderRadius: 9999, // 完全圆角，用于 pill 形状
      fontSize: 12,
      lineHeight: 1.5,
    },
  }
};

// ===== 订单状态颜色配置 =====
export const orderStatusColors = {
  pending: {
    bg: "#FEE2E2", // 浅红色背景
    text: "#991B1B", // 深红色文字
    border: "#FCA5A5", // 红色边框（可选）
  },
  confirmed: {
    bg: "#DBEAFE", // 浅蓝色背景
    text: "#1E40AF", // 深蓝色文字
    border: "#93C5FD", // 蓝色边框（可选）
  },
  delivered: {
    bg: "#D1FAE5", // 浅绿色背景
    text: "#065F46", // 深绿色文字
    border: "#6EE7B7", // 绿色边框（可选）
  },
  default: {
    bg: "#F3F4F6", // 浅灰色背景
    text: "#374151", // 深灰色文字
    border: "#D1D5DB", // 灰色边框（可选）
  },
};
