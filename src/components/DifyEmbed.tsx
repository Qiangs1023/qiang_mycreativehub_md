import { useEffect } from "react";

const DIFYP_CONFIG = {
  token: "7eDmvVv2vtjRSbBx",
  baseUrl: "http://43.167.234.114",
  inputs: {},
  systemVariables: {},
  userVariables: {},
};

export function DifyEmbed() {
  useEffect(() => {
    const config = {
      token: DIFYP_CONFIG.token,
      baseUrl: DIFYP_CONFIG.baseUrl,
      inputs: DIFYP_CONFIG.inputs,
      systemVariables: DIFYP_CONFIG.systemVariables,
      userVariables: DIFYP_CONFIG.userVariables,
    };

    window.difyChatbotConfig = config;

    const existingScript = document.getElementById(DIFYP_CONFIG.token);
    if (!existingScript) {
      const script = document.createElement("script");
      script.id = DIFYP_CONFIG.token;
      script.src = `${DIFYP_CONFIG.baseUrl}/embed.min.js`;
      script.defer = true;
      document.body.appendChild(script);
    }

    const style = document.createElement("style");
    style.setAttribute("data-dify-embed", "true");
    style.textContent = `
      #dify-chatbot-bubble-button {
        background-color: oklch(0.86 0.22 145) !important;
        width: 56px !important;
        height: 56px !important;
        bottom: 24px !important;
        right: 24px !important;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3) !important;
      }
      #dify-chatbot-bubble-button svg {
        fill: oklch(0.18 0.01 145) !important;
      }
      #dify-chatbot-bubble-window {
        width: 400px !important;
        height: 600px !important;
        max-height: calc(100vh - 120px) !important;
        border-radius: 12px !important;
        border: 1px solid oklch(0.32 0.008 70) !important;
        box-shadow: 0 8px 40px rgba(0, 0, 0, 0.4) !important;
        overflow: hidden !important;
      }
      #dify-chatbot-window-container {
        background-color: oklch(0.16 0.005 60) !important;
      }
      #dify-chatbot-close-button {
        color: oklch(0.95 0.02 80) !important;
      }
      #dify-chatbot-input-holder {
        background-color: oklch(0.19 0.006 60) !important;
        border-color: oklch(0.32 0.008 70) !important;
      }
      #dify-chatbot-text-input {
        color: oklch(0.95 0.02 80) !important;
        background-color: transparent !important;
      }
      #dify-chatbot-text-input::placeholder {
        color: oklch(0.68 0.015 80) !important;
      }
      #dify-chatbot-send-btn {
        background-color: oklch(0.86 0.22 145) !important;
      }
      #dify-chatbot-message-container {
        background-color: oklch(0.16 0.005 60) !important;
      }
      .dify-message-item {
        background-color: oklch(0.19 0.006 60) !important;
        color: oklch(0.95 0.02 80) !important;
        border-radius: 16px !important;
      }
      .dify-user-message {
        background-color: oklch(0.86 0.22 145) !important;
        color: oklch(0.18 0.01 145) !important;
      }
      .dify-chatbot-footer {
        background-color: oklch(0.16 0.005 60) !important;
        border-top-color: oklch(0.32 0.008 70) !important;
      }
      .dify-chatbot-footer-text {
        color: oklch(0.68 0.015 80) !important;
      }
    `;
    document.head.appendChild(style);

    return () => {
      const script = document.getElementById(DIFYP_CONFIG.token);
      if (script) {
        script.remove();
      }
      const existingStyle = document.querySelector('style[data-dify-embed]');
      if (existingStyle) {
        existingStyle.remove();
      }
    };
  }, []);

  return null;
}

declare global {
  interface Window {
    difyChatbotConfig: {
      token: string;
      baseUrl: string;
      inputs?: Record<string, unknown>;
      systemVariables?: Record<string, unknown>;
      userVariables?: Record<string, unknown>;
    };
  }
}