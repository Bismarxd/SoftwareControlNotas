// components/ui/Tooltip.tsx
import React, { ReactNode, useState } from "react";

interface TooltipProps {
  content: string; // Texto que se muestra en el tooltip
  children: ReactNode; // Elemento que lo dispara
}

const Tooltip: React.FC<TooltipProps> = ({ content, children }) => {
  const [visible, setVisible] = useState(false);

  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      {children}
      {visible && (
        <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs rounded px-2 py-1 whitespace-nowrap z-50">
          {content}
        </div>
      )}
    </div>
  );
};

export default Tooltip;
