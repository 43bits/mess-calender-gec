import React from "react";

export function Modal({ open, onClose, children }: { open: boolean; onClose: () => void; children: React.ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-transparent backdrop-blur-lg dark:bg-black/50">
      <div className="bg-white dark:bg-[#232326] rounded-lg shadow-lg p-6 min-w-[350px] relative">
        <button
          className="absolute top-2 right-2 text-gray-400 hover:text-gray-700"
          onClick={onClose}
        >
          ×
        </button>
        {children}
      </div>
    </div>
  );
}