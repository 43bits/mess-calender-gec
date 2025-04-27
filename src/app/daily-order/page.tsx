"use client";
import React, { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useUserRole } from "@/hooks/useUserRole";

type MealType = "veg" | "non-veg";
type MealName = "breakfast" | "lunch" | "dinner";

type TypeStats = {
  [key in MealType]: { count: number; amount: number };
};
type MealStats = {
  mealCounts: { [key in MealName]: number };
  typeStats: { [key in MealName]: TypeStats };
  todayAmount: number;
  monthAmount: number;
  halfYearAmount: number;
  yearAmount: number;
};

const MEALS: MealName[] = ["breakfast", "lunch", "dinner"];

export default function DailyOrderPage() {
  const { isAdmin, isLoading: isRoleLoading } = useUserRole();
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    return today.toISOString().slice(0, 10);
  });

  const mealStats = useQuery(api.admin.getMealStats, { date: selectedDate }) as MealStats | undefined;

  if ( isRoleLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="loading loading-spinner loading-lg" />
        <p>Loading...</p>
      </div>
    );
  }
  
  if (!isAdmin) {
    return (
      <div className="container mx-auto p-4">
        <div className="text-center text-muted-foreground">
          You do not have permission to access this page.
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-3xl mx-auto py-10">
      <h1 className="text-2xl font-bold mb-6">Daily Meal Orders (Admin)</h1>
      <div className="mb-6 flex flex-col sm:flex-row gap-4 items-center">
        <label className="font-semibold">Select Day:</label>
        <input
          type="date"
          value={selectedDate}
          onChange={e => setSelectedDate(e.target.value)}
          className="border rounded px-3 py-2"
        />
      </div>
      {mealStats ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
            {MEALS.map(meal => (
              <div key={meal} className="rounded-lg border shadow-sm p-6 bg-white dark:bg-[#18181b]">
                <div className="font-semibold text-lg capitalize">{meal}</div>
                <div className="text-3xl font-bold mt-2">{mealStats.mealCounts[meal] ?? 0}</div>
                <div className="text-sm text-muted-foreground mt-1">Marked meals</div>
                <div className="mt-4 flex flex-col gap-2">
                  <div className="flex justify-between items-center">
                    <span className="text-green-600 dark:text-green-400 font-medium">Veg</span>
                    <span>
                      {mealStats.typeStats[meal].veg.count} × ₹
                      {mealStats.typeStats[meal].veg.count > 0
                        ? (mealStats.typeStats[meal].veg.amount / mealStats.typeStats[meal].veg.count).toFixed(0)
                        : 0}
                      {" = "}
                      <span className="font-semibold">₹{mealStats.typeStats[meal].veg.amount}</span>
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-red-600 dark:text-red-400 font-medium">Non-Veg</span>
                    <span>
                      {mealStats.typeStats[meal]["non-veg"].count} × ₹
                      {mealStats.typeStats[meal]["non-veg"].count > 0
                        ? (mealStats.typeStats[meal]["non-veg"].amount / mealStats.typeStats[meal]["non-veg"].count).toFixed(0)
                        : 0}
                      {" = "}
                      <span className="font-semibold">₹{mealStats.typeStats[meal]["non-veg"].amount}</span>
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="rounded-lg border shadow-sm p-6 bg-white dark:bg-[#18181b]">
            <div className="font-semibold text-lg">
            {new Date(selectedDate).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })} Amount
            </div>
              <div className="text-2xl font-bold mt-2">₹{mealStats.todayAmount ?? 0}</div>
            </div>
            <div className="rounded-lg border shadow-sm p-6 bg-white dark:bg-[#18181b]">
              <div className="font-semibold text-lg">Monthly Amount</div>
              <div className="text-2xl font-bold mt-2">₹{mealStats.monthAmount ?? 0}</div>
            </div>
            <div className="rounded-lg border shadow-sm p-6 bg-white dark:bg-[#18181b]">
              <div className="font-semibold text-lg">Half-Year Amount</div>
              <div className="text-2xl font-bold mt-2">₹{mealStats.halfYearAmount ?? 0}</div>
            </div>
            <div className="rounded-lg border shadow-sm p-6 bg-white dark:bg-[#18181b]">
              <div className="font-semibold text-lg">Full Year Amount</div>
              <div className="text-2xl font-bold mt-2">₹{mealStats.yearAmount ?? 0}</div>
            </div>
          </div>
        </>
      ) : (
        <div className="text-center text-muted-foreground py-10">Loading...</div>
      )}
    </div>
  );
}