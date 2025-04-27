"use client";
import { Card } from "@/components/ui/card";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";

type MealType = "breakfast" | "lunch" | "dinner";
type DayType = "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday";

const dayOrder: DayType[] = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];
const meals: MealType[] = ["breakfast", "lunch", "dinner"];

export default function MenuCardPage() {
  // Fetch menu and prices from Convex
  const menuRaw = useQuery(api.menu.getMenu);
  const pricesRaw = useQuery(api.menu.getPrices);

  // Loading state
  if (menuRaw === undefined || pricesRaw === undefined) {
    return (
      <div className="container mx-auto p-4 sm:p-6">
        <Card className="bg-background p-6 text-center">Loading menu...</Card>
      </div>
    );
  }

  // Fallback if menu is empty
  if (!menuRaw || Object.keys(menuRaw).length === 0) {
    return (
      <div className="container mx-auto p-4 sm:p-6">
        <Card className="bg-background p-6 text-center">Menu not set by admin.</Card>
      </div>
    );
  }

  // Get current day
  const today = new Date().toLocaleDateString("en-US", { weekday: "long" }).toLowerCase() as DayType;
  const todaysMenu = menuRaw[today];

  

  return (
    <div className="container mx-auto p-4 sm:p-6">
      {/* Today's Menu Card */}
      <Card className="bg-background p-6 mb-8">
        <h2 className="text-xl font-bold mb-4">
          Today's Menu - {today.charAt(0).toUpperCase() + today.slice(1)}
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {meals.map((meal) => (
            <div key={meal} className="bg-muted/20 p-4 rounded-lg">
              <h3 className="font-semibold capitalize mb-2">{meal}</h3>
              <ul className="space-y-1 text-sm text-muted-foreground">
                {(todaysMenu?.[meal] ?? []).map((item: string, index: number) => (
                  <li key={index}>{item || <span className="text-gray-400">-</span>}</li>
                ))}
              </ul>
              <div className="mt-2 text-xs text-muted-foreground">
                Price: ₹
                {meal === "breakfast"
                  ? pricesRaw.breakfast
                  : meal === "lunch"
                  ? `${pricesRaw.lunchVeg} (Veg) / ${pricesRaw.lunchNonVeg} (Non-Veg)`
                  : `${pricesRaw.dinnerVeg} (Veg) / ${pricesRaw.dinnerNonVeg} (Non-Veg)`}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Weekly Menu Table */}
      <Card className="bg-background p-6">
        <h1 className="text-2xl font-bold mb-6 text-center">Weekly Menu Card</h1>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead className="bg-muted">
              <tr>
                <th className="border p-3 text-left">Meals</th>
                {dayOrder.map((day) => (
                  <th key={day} className="border p-3 capitalize text-center">
                    {day}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {meals.map((meal) => (
                <tr key={meal} className="hover:bg-muted/50 transition-colors">
                  <td className="border p-3 font-medium capitalize bg-muted/20">
                    {meal}
                  </td>
                  {dayOrder.map((day) => (
                    <td key={`${day}-${meal}`} className="border p-3">
                      <div className="text-sm space-y-1">
                        {(menuRaw[day]?.[meal] ?? []).map((item: string, index: number) => (
                          <div
                            key={`${item}-${index}`}
                            className="text-muted-foreground text-center"
                          >
                            {item || <span className="text-gray-400">-</span>}
                          </div>
                        ))}
                      </div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}