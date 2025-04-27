"use strict";
import { mutation, query } from './_generated/server';
import { v } from 'convex/values';
import { internalMutation } from "./_generated/server";
type MealType = 'veg' | 'non-veg';
type MealTime = 'breakfast' | 'lunch' | 'dinner';

// Price constants
const mealPrices = {
  breakfast: 50,
  lunch: { veg: 70, 'non-veg': 80 },
  dinner: { veg: 70, 'non-veg': 80 },
} as const;

// Helper function to calculate meal price
const calculateMealPrice = (meal: MealTime, type: MealType): number => {
  if (meal === 'breakfast') return mealPrices.breakfast;
  return mealPrices[meal][type];
};

// Helper to parse meal key
const parseMealKey = (key: string): { year: number; month: number; day: number; meal: MealTime } => {
  const [year, month, day, meal] = key.split('-');
  return {
    year: parseInt(year),
    month: parseInt(month),
    day: parseInt(day),
    meal: meal as MealTime,
  };
};

export const get = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return { selections: {}, totalAmount: 0, monthlyTotals: {} };

    const selections = await ctx.db
      .query('mealSelections')
      .withIndex('by_clerk_id', q => 
        q.eq('clerkId', identity.subject)
      )
      .collect();

    const result: Record<string, MealType> = {};
    const monthlyTotals: Record<string, number> = {};
    let totalAmount = 0;

    selections.forEach((selection) => {
      const { key, type } = selection;
      result[key] = type as MealType;
      
      const { year, month, meal } = parseMealKey(key);
      const monthKey = `${year}-${month}`;
      const price = calculateMealPrice(meal as MealTime, type as MealType);
      
      monthlyTotals[monthKey] = (monthlyTotals[monthKey] || 0) + price;
      totalAmount += price;
    });

    return {
      selections: result,
      totalAmount,
      monthlyTotals,
      lastUpdated: new Date().toISOString()
    };
  }
});

export const update = mutation({
  args: {
    key: v.string(),
    type: v.optional(v.union(v.literal('veg'), v.literal('non-veg'))),
    clerkId: v.string(),
    isAdminAction: v.optional(v.boolean()),
    adminId: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    const { key, type, clerkId, isAdminAction, adminId } = args;
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error('Not authenticated');

    // Always use the student's clerkId for querying and updating
    const existing = await ctx.db
      .query('mealSelections')
      .withIndex('by_clerk_id', q => q.eq('clerkId', clerkId))
      .filter(q => q.eq(q.field('key'), key))
      .first();

    const now = new Date().toISOString();
    const { year, month, day, meal } = parseMealKey(key);

    if (existing) {
      if (type) {
        await ctx.db.patch(existing._id, {
          type,
          updatedAt: now,
          updatedBy: adminId || identity.subject,
          adminModified: isAdminAction || false,
          amount: calculateMealPrice(meal, type)
        });
      } else {
        await ctx.db.delete(existing._id);
      }
    } else if (type) {
      await ctx.db.insert('mealSelections', {
        key,
        type,
        clerkId, // Always the student's ID
        meal,
        amount: calculateMealPrice(meal, type),
        year,
        month,
        day,
        createdAt: now,
        createdBy: adminId || identity.subject,
        updatedAt: now,
        updatedBy: adminId || identity.subject,
        adminCreated: isAdminAction || false,
        adminModified: isAdminAction || false,
        selections: {},
      });
    }

    return { success: true };
  }
});

// --- NEW getUserMeals: supports both clerkId and userDbId ---
export const getUserMeals = query({
  args: {
    userId: v.optional(v.string()), // Clerk ID
    userDbId: v.optional(v.id("users")), // Convex user _id
  },
  handler: async (ctx, args) => {
    // Try to resolve clerkId
    let clerkId = args.userId;
    if ((!clerkId || clerkId.trim() === "") && args.userDbId) {
      const user = await ctx.db.get(args.userDbId);
      if (user && typeof user.clerkId === "string" && user.clerkId.length > 0) {
        clerkId = user.clerkId;
      }
    }

    if (!clerkId || clerkId.trim() === "") {
      throw new Error("clerkId is required. Provide a valid userId (clerkId) or userDbId.");
    }

    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    // Check admin status
    const admin = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", q => q.eq("clerkId", identity.subject))
      .filter(q => q.eq(q.field("role"), "admin"))
      .first();

    if (!admin) throw new Error("Not authorized");

    // Get user's meal selections
    const selections = await ctx.db
      .query("mealSelections")
      .withIndex("by_clerk_id", q => q.eq("clerkId", clerkId))
      .collect();

    const result: Record<string, MealType> = {};
    const monthlyTotals: Record<string, number> = {};
    let totalAmount = 0;

    selections.forEach((selection) => {
      const { key, type, amount } = selection;
      if (type) {
        result[key] = type as MealType;
        const [year, month] = key.split("-");
        const monthKey = `${year}-${month}`;
        monthlyTotals[monthKey] = (monthlyTotals[monthKey] || 0) + (amount || 0);
        totalAmount += amount || 0;
      }
    });

    return {
      selections: result,
      monthlyTotals,
      totalAmount,
      lastUpdated: new Date().toISOString(),
    };
  },
});

export const fixMealSelections = internalMutation({
  handler: async (ctx) => {
    const all = await ctx.db.query("mealSelections").collect();
    for (const doc of all) {
      if (doc.selections === undefined) {
        await ctx.db.patch(doc._id, { selections: {} });
      }
    }
  }
});