"use client";
import React, { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useUserRole } from "@/hooks/useUserRole";

type Menu = {
  [day: string]: {
    [meal: string]: string[];
  };
};

const defaultMenu: Menu = {
  monday: { breakfast: [""], lunch: [""], dinner: [""] },
  tuesday: { breakfast: [""], lunch: [""], dinner: [""] },
  wednesday: { breakfast: [""], lunch: [""], dinner: [""] },
  thursday: { breakfast: [""], lunch: [""], dinner: [""] },
  friday: { breakfast: [""], lunch: [""], dinner: [""] },
  saturday: { breakfast: [""], lunch: [""], dinner: [""] },
  sunday: { breakfast: [""], lunch: [""], dinner: [""] },
};

const dayOrder = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

export default function MealSettingsPage() {
  const menuRaw = useQuery(api.menu.getMenu);
  const pricesRaw = useQuery(api.menu.getPrices);
  const { isAdmin, isLoading: isRoleLoading } = useUserRole();
  
  const updateMenu = useMutation(api.menu.updateMenu);
  const updatePrices = useMutation(api.menu.updatePrices);

  // State for menu and prices
  const [menuState, setMenuState] = useState<Menu>(defaultMenu);
  const [priceState, setPriceState] = useState({
    breakfast: 50, lunchVeg: 70, lunchNonVeg: 80, dinnerVeg: 70, dinnerNonVeg: 80,
  });

  // Edit mode state
  const [isEditingMenu, setIsEditingMenu] = useState(false);
  const [isEditingPrices, setIsEditingPrices] = useState(false);

  // Sync menu state with DB
  React.useEffect(() => {
    if (menuRaw === undefined) return; // still loading
    setMenuState(Object.keys(menuRaw || {}).length === 0 ? defaultMenu : menuRaw);
  }, [menuRaw]);

  // Sync price state with DB
  React.useEffect(() => {
    if (pricesRaw === undefined) return;
    setPriceState({
      breakfast: pricesRaw.breakfast ?? 50,
      lunchVeg: pricesRaw.lunchVeg ?? 70,
      lunchNonVeg: pricesRaw.lunchNonVeg ?? 80,
      dinnerVeg: pricesRaw.dinnerVeg ?? 70,
      dinnerNonVeg: pricesRaw.dinnerNonVeg ?? 80,
    });
  }, [pricesRaw]);

  // Menu item change handler
  const handleMenuChange = (day: string, meal: string, idx: number, value: string) => {
    setMenuState((prev: Menu) => ({
      ...prev,
      [day]: {
        ...prev[day],
        [meal]: prev[day]?.[meal]?.map((item, i) => (i === idx ? value : item)) || [],
      },
    }));
  };

  // Price change handler
  const handlePriceChange = (key: string, value: string) => {
    setPriceState((prev) => ({ ...prev, [key]: Number(value) }));
  };

  // Save handlers
  const handleSaveMenu = async () => {
    await updateMenu({ data: menuState });
    setIsEditingMenu(false);
  };
  const handleSavePrices = async () => {
    await updatePrices(priceState);
    setIsEditingPrices(false);
  };

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
    <div className="container max-w-3xl mx-auto py-10 space-y-10">
      <h1 className="text-3xl font-bold mb-8 text-center">Meal Settings</h1>

      {/* Menu Editor */}
      <div className="space-y-6">
        <h2 className="font-semibold text-xl mb-2">Edit Weekly Menu</h2>
        {menuRaw === undefined ? (
          <div>Loading menu...</div>
        ) : (
          dayOrder.map((day) => (
            <div
              key={day}
              className="rounded-2xl shadow-md bg-white dark:bg-[#18181b] p-6 mb-2 border"
            >
              <div className="font-bold capitalize text-lg mb-2">{day}</div>
              {Object.entries(menuState[day] || {}).map(([meal, items]) => (
                <div key={meal} className="flex items-center mb-2">
                  <span className="capitalize font-medium w-24">{meal}:</span>
                  {(items || []).map((item: string, idx: number) =>
                    isEditingMenu ? (
                      <input
                        key={idx}
                        className="border rounded px-2 py-1 mx-1 mb-1 w-32"
                        value={item}
                        onChange={e => handleMenuChange(day, meal, idx, e.target.value)}
                      />
                    ) : (
                      <span
                        key={idx}
                        className="inline-block border rounded px-2 py-1 mx-1 mb-1 bg-gray-100 dark:bg-gray-800 w-32 text-center"
                      >
                        {item || <span className="text-gray-400">-</span>}
                      </span>
                    )
                  )}
                </div>
              ))}
            </div>
          ))
        )}
        <div className="flex justify-end">
          {isEditingMenu ? (
            <button
              className="mt-2 px-6 py-2 bg-green-600 text-white rounded-lg shadow"
              onClick={handleSaveMenu}
            >
              Save Menu
            </button>
          ) : (
            <button
              className="mt-2 px-6 py-2 bg-blue-600 text-white rounded-lg shadow"
              onClick={() => setIsEditingMenu(true)}
            >
              Edit Menu
            </button>
          )}
        </div>
      </div>

      {/* Price Editor */}
      <div className="rounded-2xl shadow-md bg-white dark:bg-[#18181b] p-6 border">
        <h2 className="font-semibold text-xl mb-4">Edit Meal Prices</h2>
        <div className="grid grid-cols-2 gap-4">
          <label>Breakfast Price</label>
          {isEditingPrices ? (
            <input
              type="number"
              value={priceState.breakfast}
              onChange={e => handlePriceChange("breakfast", e.target.value)}
              className="border rounded px-2 py-1"
            />
          ) : (
            <span className="py-1">{priceState.breakfast}</span>
          )}
          <label>Lunch Veg Price</label>
          {isEditingPrices ? (
            <input
              type="number"
              value={priceState.lunchVeg}
              onChange={e => handlePriceChange("lunchVeg", e.target.value)}
              className="border rounded px-2 py-1"
            />
          ) : (
            <span className="py-1">{priceState.lunchVeg}</span>
          )}
          <label>Lunch Non-Veg Price</label>
          {isEditingPrices ? (
            <input
              type="number"
              value={priceState.lunchNonVeg}
              onChange={e => handlePriceChange("lunchNonVeg", e.target.value)}
              className="border rounded px-2 py-1"
            />
          ) : (
            <span className="py-1">{priceState.lunchNonVeg}</span>
          )}
          <label>Dinner Veg Price</label>
          {isEditingPrices ? (
            <input
              type="number"
              value={priceState.dinnerVeg}
              onChange={e => handlePriceChange("dinnerVeg", e.target.value)}
              className="border rounded px-2 py-1"
            />
          ) : (
            <span className="py-1">{priceState.dinnerVeg}</span>
          )}
          <label>Dinner Non-Veg Price</label>
          {isEditingPrices ? (
            <input
              type="number"
              value={priceState.dinnerNonVeg}
              onChange={e => handlePriceChange("dinnerNonVeg", e.target.value)}
              className="border rounded px-2 py-1"
            />
          ) : (
            <span className="py-1">{priceState.dinnerNonVeg}</span>
          )}
        </div>
        <div className="flex justify-end">
          {isEditingPrices ? (
            <button
              className="mt-4 px-6 py-2 bg-green-600 text-white rounded-lg shadow"
              onClick={handleSavePrices}
            >
              Save Prices
            </button>
          ) : (
            <button
              className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg shadow"
              onClick={() => setIsEditingPrices(true)}
            >
              Edit Prices
            </button>
          )}
        </div>
      </div>
    </div>
  );
}