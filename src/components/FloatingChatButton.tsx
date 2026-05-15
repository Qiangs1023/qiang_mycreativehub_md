import { useState } from "react";
import { MessageCircle } from "lucide-react";

export function FloatingChatButton() {
  const [hovered, setHovered] = useState(false);

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <button
        onClick={() => window.open("http://web.benevolent.top/", "_blank")}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className="group relative flex items-center gap-2 rounded-full bg-primary p-4 text-primary-foreground shadow-lg transition-all hover:-translate-y-1 hover:shadow-xl"
        aria-label="打开 AI 助手"
      >
        <MessageCircle className="h-6 w-6 transition-transform group-hover:scale-110" />
        
        {hovered && (
          <span className="absolute right-full mr-3 whitespace-nowrap rounded-full border border-hairline bg-surface px-4 py-2 text-sm font-medium text-foreground shadow-md animate-in fade-in slide-in-from-right-2">
            AI 助手
          </span>
        )}
      </button>
    </div>
  );
}