"use client";
import { useState, useMemo } from "react";
import { useUser } from "@clerk/nextjs";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { isMealMarkingAllowed } from "@/constants";
import { SendRequestCard } from "@/components/sendRequestCard";
import { useUserRole } from "@/hooks/useUserRole";

const MEALS = [
  { label: "Breakfast", value: "breakfast" },
  { label: "Lunch", value: "lunch" },
  { label: "Dinner", value: "dinner" },
];

export default function SendRequestPage() {
  const { isStudent, isLoading: isRoleLoading } = useUserRole();
  const { user } = useUser();
  const sendRequest = useMutation(api.mealRequests.sendRequest);

  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10); // "YYYY-MM-DD"

  // Find which meals are closed for marking today
  const closedMeals = useMemo(
    () =>
      MEALS.filter((meal) => {
        const now = new Date();
        const isToday =
          today.getFullYear() === now.getFullYear() &&
          today.getMonth() === now.getMonth() &&
          today.getDate() === now.getDate();

        // Hide breakfast after 9 AM today
        if (meal.value === "breakfast" && isToday && now.getHours() >= 9) {
          return false;
        }

        // Hide lunch after 7 PM today (when dinner time starts)
        if (meal.value === "lunch" && isToday && now.getHours() >= 19) {
          return false;
        }

        return !isMealMarkingAllowed(today, meal.value as any);
      }),
    [today]
  );

  const [selectedMeal, setSelectedMeal] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [selectedType, setSelectedType] = useState<"veg" | "non-veg" | null>(null);

  const handleSend = async (type: "veg" | "non-veg") => {
    if (!user?.id || !selectedMeal) return;
    setStatus("sending");
    setSelectedType(type);
    try {
      await sendRequest({
        clerkId: user.id,
        meal: selectedMeal,
        date: todayStr,
        reason: reason.trim() || undefined,
        type,
      });
      setStatus("sent");
      // No onClose here, just feedback
    } catch (e) {
      setStatus("error");
    }
  };

  if (isRoleLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="loading loading-spinner loading-lg" />
        <p>Loading...</p>
      </div>
    );
  }

  if (!isStudent) {
    return (
      <div className="container mx-auto p-4">
        <div className="text-center text-muted-foreground">
          You do not have permission to access this page.
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-lg mx-auto py-10">
      <h1 className="text-2xl font-bold mb-6">Missed Meal Marking Request</h1>
      <p className="mb-4 text-muted-foreground">
        If you missed marking a meal for today, select the meal and send a request to the admin.
      </p>
      {closedMeals.length === 0 ? (
        <div className="text-green-600 font-medium">
          All meals are still open for marking today!
        </div>
      ) : (
        <SendRequestCard
          meals={MEALS}
          closedMeals={closedMeals}
          selectedMeal={selectedMeal}
          setSelectedMeal={setSelectedMeal}
          reason={reason}
          setReason={setReason}
          status={status}
          selectedType={selectedType}
          handleSend={handleSend}
        />
      )}
    </div>
  );
}