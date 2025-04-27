import React from "react";

interface SendRequestCardProps {
  meals: { label: string; value: string }[];
  closedMeals: { label: string; value: string }[];
  selectedMeal: string | null;
  setSelectedMeal: (meal: string) => void;
  reason: string;
  setReason: (reason: string) => void;
  status: "idle" | "sending" | "sent" | "error";
  selectedType: "veg" | "non-veg" | null;
  handleSend: (type: "veg" | "non-veg") => void;
}

export const SendRequestCard: React.FC<SendRequestCardProps> = ({
  meals,
  closedMeals,
  selectedMeal,
  setSelectedMeal,
  reason,
  setReason,
  status,
  selectedType,
  handleSend,
}) => (
  <div className="rounded-lg border shadow-sm p-4 sm:p-6 space-y-6 bg-white text-[#232326] dark:bg-[#18181b] dark:text-white transition-colors duration-300 w-full max-w-md mx-auto">
    <div className="grid grid-cols-1 gap-3">
      {closedMeals.map((meal) => (
        <button
          key={meal.value}
          className={`p-4 rounded-lg border transition-all font-semibold text-base w-full
            ${
              selectedMeal === meal.value
                ? "bg-blue-500 text-white border-blue-500 dark:bg-blue-700 dark:border-blue-700"
                : "bg-gray-100 text-[#232326] border-gray-300 hover:bg-gray-200 dark:bg-[#232326] dark:text-white dark:border-gray-700 dark:hover:bg-[#232326]/80"
            }`}
          onClick={() => setSelectedMeal(meal.value)}
        >
          {meal.label}
        </button>
      ))}
    </div>
    <textarea
      className="w-full mt-4 p-3 border rounded-lg bg-gray-100 text-[#232326] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600 dark:bg-[#232326] dark:text-white dark:border-gray-700 dark:placeholder-gray-400 transition-colors"
      placeholder="Optional: Reason for request"
      value={reason}
      onChange={(e) => setReason(e.target.value)}
      rows={3}
    />
    <div className="flex flex-col sm:flex-row gap-4 mt-2">
      <button
        className={`flex-1 py-2 rounded-lg font-semibold transition-all
          ${
            status === "sending" && selectedType === "veg"
              ? "bg-green-400 text-white"
              : "bg-green-600 hover:bg-green-700 text-white"
          } disabled:opacity-50`}
        disabled={!selectedMeal || status === "sending" || status === "sent"}
        onClick={() => handleSend("veg")}
      >
        {status === "sending" && selectedType === "veg"
          ? "Sending..."
          : status === "sent" && selectedType === "veg"
          ? "Request Sent!"
          : "Send Veg"}
      </button>
      <button
        className={`flex-1 py-2 rounded-lg font-semibold transition-all
          ${
            status === "sending" && selectedType === "non-veg"
              ? "bg-red-400 text-white"
              : "bg-red-600 hover:bg-red-700 text-white"
          } disabled:opacity-50`}
        disabled={!selectedMeal || status === "sending" || status === "sent"}
        onClick={() => handleSend("non-veg")}
      >
        {status === "sending" && selectedType === "non-veg"
          ? "Sending..."
          : status === "sent" && selectedType === "non-veg"
          ? "Request Sent!"
          : "Send Non-Veg"}
      </button>
    </div>
    {status === "error" && (
      <div className="text-red-500 mt-2 text-center">Failed to send request. Try again.</div>
    )}
  </div>
);