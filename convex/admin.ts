import { query } from "./_generated/server";
import { v } from "convex/values";

// Helper to get date parts
function getDateParts(dateStr: string) {
  const [year, month, day] = dateStr.split("-").map(Number);
  return { year, month, day };
}

export const getMealStats = query({
  args: {
    date: v.string(), // "YYYY-MM-DD"
  },
  handler: async (ctx, args) => {
    const { year, month, day } = getDateParts(args.date);

    // Get all mealSelections for the selected day
    const selections = await ctx.db
      .query("mealSelections")
      .withIndex("by_date", q =>
        q.eq("year", year).eq("month", month).eq("day", day)
      )
      .collect();

    // Per-meal, per-type stats
    const mealTypes = ["breakfast", "lunch", "dinner"];
    const typeStats = {
      breakfast: { veg: { count: 0, amount: 0 }, "non-veg": { count: 0, amount: 0 } },
      lunch: { veg: { count: 0, amount: 0 }, "non-veg": { count: 0, amount: 0 } },
      dinner: { veg: { count: 0, amount: 0 }, "non-veg": { count: 0, amount: 0 } },
    };

    let todayAmount = 0;
    selections.forEach(sel => {
      if (
        sel.meal &&
        mealTypes.includes(sel.meal) &&
        (sel.type === "veg" || sel.type === "non-veg")
      ) {
        typeStats[sel.meal][sel.type].count++;
        typeStats[sel.meal][sel.type].amount += sel.amount || 0;
        todayAmount += sel.amount || 0;
      }
    });

    // For summary
    const mealCounts = {
      breakfast: typeStats.breakfast.veg.count + typeStats.breakfast["non-veg"].count,
      lunch: typeStats.lunch.veg.count + typeStats.lunch["non-veg"].count,
      dinner: typeStats.dinner.veg.count + typeStats.dinner["non-veg"].count,
    };

    // Get all mealSelections for the month
    const monthSelections = await ctx.db
      .query("mealSelections")
      .withIndex("by_date", q =>
        q.eq("year", year).eq("month", month)
      )
      .collect();
    const monthAmount = monthSelections.reduce((sum, sel) => sum + (sel.amount || 0), 0);

    // Get all mealSelections for the year
    const yearSelections = await ctx.db
      .query("mealSelections")
      .withIndex("by_date", q => q.eq("year", year))
      .collect();
    const yearAmount = yearSelections.reduce((sum, sel) => sum + (sel.amount || 0), 0);

    // Get all mealSelections for half-year (Jan-Jun or Jul-Dec)
    const halfYearStart = month <= 6 ? 1 : 7;
    const halfYearEnd = month <= 6 ? 6 : 12;
    const halfYearSelections = yearSelections.filter(sel =>
      typeof sel.month === "number" &&
      sel.month >= halfYearStart &&
      sel.month <= halfYearEnd
    );
    const halfYearAmount = halfYearSelections.reduce((sum, sel) => sum + (sel.amount || 0), 0);

    return {
      mealCounts,
      typeStats,
      todayAmount,
      monthAmount,
      halfYearAmount,
      yearAmount,
    };
  }
});