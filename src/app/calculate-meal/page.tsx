"use client";

import { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useUserRole } from '@/hooks/useUserRole';
import { useUser } from "@clerk/nextjs";
import { Card } from '@/components/ui/card';
//constant 
import { isMealMarkingAllowed, getMealStatus } from "@/constants";

const months = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

type MealType = 'veg' | 'non-veg';
type MealTime = 'breakfast' | 'lunch' | 'dinner';

interface MealSelection {
  selections: Record<string, MealType>;
  monthlyTotals: Record<string, number>;
  totalAmount: number;
  lastUpdated: string;
}

interface MonthData {
  totalAmount: number;
  breakfastCount: number;
  vegLunchCount: number;
  nonVegLunchCount: number;
  vegDinnerCount: number;
  nonVegDinnerCount: number;
}
interface MealUpdate {
  key: string;
  type: MealType | undefined;
  clerkId: string;
  isAdminAction?: boolean;
  adminId?: string;
}

export default function CalculatePage() {
  const { user } = useUser();
  const currentDate = new Date();
  const [month, setMonth] = useState(currentDate.getMonth());
  const [year, setYear] = useState(currentDate.getFullYear());
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { isStudent, isLoading: isRoleLoading } = useUserRole();

  const updateMealSelection = useMutation(api.mealSelections.update);

  const { isAdmin } = useUserRole();
  const mealData = useQuery(api.mealSelections.get) as MealSelection | undefined;
  const mealSelections = mealData?.selections || {};

  // Fetch admin-editable prices
  const pricesRaw = useQuery(api.menu.getPrices);

  // Responsive: fallback prices if not loaded yet
  const prices = pricesRaw ?? {
    breakfast: 50, lunchVeg: 70, lunchNonVeg: 80, dinnerVeg: 70, dinnerNonVeg: 80
  };

  // Use admin-editable prices for all calculations
  const calculateMealPrice = (meal: MealTime, type: MealType): number => {
    if (meal === 'breakfast') return prices.breakfast;
    if (meal === 'lunch') return type === 'veg' ? prices.lunchVeg : prices.lunchNonVeg;
    if (meal === 'dinner') return type === 'veg' ? prices.dinnerVeg : prices.dinnerNonVeg;
    return 0;
  };

  const toggleMeal = async (dateKey: string, meal: MealTime) => {
    if (!user?.id || isUpdating) return;
  
    const key = `${dateKey}-${meal}`;
    const current = mealSelections[key];
    let next: MealType | undefined;
  
    if (!current) next = 'veg';
    else if (current === 'veg') next = 'non-veg';
    else next = undefined;
  
    try {
      setIsUpdating(true);
      setError(null);
      
      // Student specific updates - no admin flags
      await updateMealSelection({
        key,
        type: next,
        clerkId: user.id,  // Student's own ID
        isAdminAction: false // Explicitly mark as student action
      });
    } catch (error) {
      console.error('Failed to update meal:', error);
      setError('Failed to update meal selection');
    } finally {
      setIsUpdating(false);
    }
  };

  const isMarkingAllowed = (date: Date, meal: MealTime) => {
    return isMealMarkingAllowed(date, meal);
  };

  const getMonthData = (mealSelections: Record<string, MealType>, year: number, month: number): MonthData => {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    let monthData: MonthData = {
      totalAmount: 0,
      breakfastCount: 0,
      vegLunchCount: 0,
      nonVegLunchCount: 0,
      vegDinnerCount: 0,
      nonVegDinnerCount: 0
    };

    for (let d = 1; d <= daysInMonth; d++) {
      const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      (['breakfast', 'lunch', 'dinner'] as MealTime[]).forEach((meal) => {
        const key = `${dateKey}-${meal}`;
        const type = mealSelections[key];
        if (type) {
          if (meal === 'breakfast') {
            monthData.breakfastCount++;
            monthData.totalAmount += calculateMealPrice(meal, type);
          } else if (meal === 'lunch') {
            if (type === 'veg') {
              monthData.vegLunchCount++;
              monthData.totalAmount += calculateMealPrice(meal, type);
            } else {
              monthData.nonVegLunchCount++;
              monthData.totalAmount += calculateMealPrice(meal, type);
            }
          } else if (meal === 'dinner') {
            if (type === 'veg') {
              monthData.vegDinnerCount++;
              monthData.totalAmount += calculateMealPrice(meal, type);
            } else {
              monthData.nonVegDinnerCount++;
              monthData.totalAmount += calculateMealPrice(meal, type);
            }
          }
        }
      });
    }
    return monthData;
  };

  const calculatedTotals = useMemo(() => {
    if (!mealData?.selections) return {
      monthTotal: 0,
      halfYearTotal: 0,
      grandTotal: 0,
      monthDetails: {
        totalAmount: 0,
        breakfastCount: 0,
        vegLunchCount: 0,
        nonVegLunchCount: 0,
        vegDinnerCount: 0,
        nonVegDinnerCount: 0
      }
    };

    const currentMonthData = getMonthData(mealData.selections, year, month);
    let halfYearTotal = currentMonthData.totalAmount;
    let grandTotal = currentMonthData.totalAmount;

    for (let i = 1; i <= 11; i++) {
      let prevMonth = month - i;
      let yearToUse = year;
      if (prevMonth < 0) {
        prevMonth += 12;
        yearToUse--;
      }
      const monthData = getMonthData(mealData.selections, yearToUse, prevMonth);
      if (i <= 5) halfYearTotal += monthData.totalAmount;
      grandTotal += monthData.totalAmount;
    }

    return {
      monthTotal: currentMonthData.totalAmount,
      halfYearTotal,
      grandTotal,
      monthDetails: currentMonthData
    };
  }, [mealData, month, year, prices]);

  if (!mealData || !pricesRaw) {
    return (
      <div className="container mx-auto p-4">
        <div className="bg-background border rounded-lg p-4 flex items-center justify-center">
          <div className="loading loading-spinner loading-lg" />
        </div>
      </div>
    );
  }

  const renderMealCell = (dateKey: string, meal: MealTime, mealType?: MealType) => {
    const date = new Date(parseInt(dateKey.split('-')[0]), parseInt(dateKey.split('-')[1]) - 1, parseInt(dateKey.split('-')[2]));
    const isToday = dateKey === `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;
    const canMark = isMarkingAllowed(date , meal);

    return (
      <div
        key={meal}
        onClick={() => canMark && toggleMeal(dateKey, meal)}
        className={`mt-1 p-1 rounded text-xs transition-colors ${
          mealType === 'veg'
            ? 'bg-emerald-500/80 dark:bg-emerald-600/80 text-white'
            : mealType === 'non-veg'
            ? 'bg-rose-500/80 dark:bg-rose-600/80 text-white'
            : 'bg-gray-100 dark:bg-gray-700'
        } ${canMark ? 'cursor-pointer hover:opacity-90' : 'opacity-50'}
        ${isUpdating ? 'cursor-wait' : ''} ${isToday ? 'ring-2 ring-blue-500' : ''}`}
      >
        <div className="flex items-center justify-between">
          <span>{meal}</span>
          {mealType && (
            <span className="text-[10px] font-medium">
              ({mealType === 'veg' ? 'V' : 'NV'})
              <span className="ml-1">₹{calculateMealPrice(meal, mealType)}</span>
            </span>
          )}
        </div>
      </div>
    );
  };

  if ( isRoleLoading) {
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
    <div className="container mx-auto p-4 sm:p-6">
      <div className="bg-background border shadow-sm rounded-lg p-4 sm:p-6">
        {error && (
          <div className="text-sm text-red-500 mb-4">
            {error}
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-center justify-between mb-6">
          <div className="flex gap-4 w-full sm:w-auto">
            <select
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
              className="select select-bordered bg-background w-full sm:w-auto"
            >
              {months.map((m, i) => (
                <option key={i} value={i}>{m}</option>
              ))}
            </select>
            <select
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="select select-bordered bg-background w-full sm:w-auto"
            >
              {[2025, 2026, 2027, 2028].map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
          <button
            onClick={() => {
              setMonth(currentDate.getMonth());
              setYear(currentDate.getFullYear());
            }}
            className="btn btn-outline mt-2 sm:mt-0"
          >
            Today
          </button>
        </div>

        {/* Responsive calendar table */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse min-w-[600px]">
            <thead className="bg-muted">
              <tr>
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                  <th key={day} className="border border-border p-2 text-foreground">
                    {day}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(() => {
                const firstDay = new Date(year, month, 1).getDay();
                const daysInMonth = new Date(year, month + 1, 0).getDate();
                const rows = [];
                let day = 1;

                for (let i = 0; i < 6; i++) {
                  const cells = [];
                  for (let j = 0; j < 7; j++) {
                    if ((i === 0 && j < firstDay) || day > daysInMonth) {
                      cells.push(<td key={j} className="border border-border p-2" />);
                    } else {
                      const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                      cells.push(
                        <td key={j} className="border border-border p-2 text-center">
                          <div className="text-sm font-medium text-foreground">
                            {day}
                          </div>
                          {(['breakfast', 'lunch', 'dinner'] as MealTime[]).map((meal) =>
                            renderMealCell(dateKey, meal, mealSelections[`${dateKey}-${meal}`])
                          )}
                        </td>
                      );
                      day++;
                    }
                  }
                  rows.push(<tr key={i}>{cells}</tr>);
                }
                return rows;
              })()}
            </tbody>
          </table>
        </div>

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="p-4">
            <h3 className="text-lg font-semibold">Monthly Total</h3>
            <p className="text-2xl font-bold">₹{calculatedTotals.monthTotal}</p>
            <div className="text-sm text-muted-foreground mt-2">
              <p>Breakfast: {calculatedTotals.monthDetails.breakfastCount} meals</p>
              <p>Lunch (Veg): {calculatedTotals.monthDetails.vegLunchCount} meals</p>
              <p>Lunch (Non-Veg): {calculatedTotals.monthDetails.nonVegLunchCount} meals</p>
              <p>Dinner (Veg): {calculatedTotals.monthDetails.vegDinnerCount} meals</p>
              <p>Dinner (Non-Veg): {calculatedTotals.monthDetails.nonVegDinnerCount} meals</p>
            </div>
          </Card>
          <Card className="p-4">
            <h3 className="text-lg font-semibold">Half Year Total</h3>
            <p className="text-2xl font-bold">₹{calculatedTotals.halfYearTotal}</p>
            <p className="text-sm text-muted-foreground mt-2">
              Average per month: ₹{Math.round(calculatedTotals.halfYearTotal / 6)}
            </p>
          </Card>
          <Card className="p-4">
            <h3 className="text-lg font-semibold">Grand Total</h3>
            <p className="text-2xl font-bold">₹{calculatedTotals.grandTotal}</p>
            <p className="text-sm text-muted-foreground mt-2">
              Average per month: ₹{Math.round(calculatedTotals.grandTotal / 12)}
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}