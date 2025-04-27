import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Get menu
export const getMenu = query(async (ctx) => {
  const menu = await ctx.db.query("menu").first();
  return menu?.data ?? null;
});

// Update menu
export const updateMenu = mutation({
  args: { data: v.any() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    const existing = await ctx.db.query("menu").first();
    if (existing) {
      await ctx.db.patch(existing._id, {
        data: args.data,
        updatedAt: new Date().toISOString(),
        updatedBy: identity.subject,
      });
    } else {
      await ctx.db.insert("menu", {
        data: args.data,
        updatedAt: new Date().toISOString(),
        updatedBy: identity.subject,
      });
    }
  },
});

// Get prices
export const getPrices = query(async (ctx) => {
    const prices = await ctx.db.query("mealPrices").first();
    return prices ?? {
      breakfast: 50, lunchVeg: 70, lunchNonVeg: 80, dinnerVeg: 70, dinnerNonVeg: 80
    };
  });

// Update prices
export const updatePrices = mutation({
    args: {
      breakfast: v.float64(),
      lunchVeg: v.float64(),
      lunchNonVeg: v.float64(),
      dinnerVeg: v.float64(),
      dinnerNonVeg: v.float64(),
    },
    handler: async (ctx, args) => {
      const existing = await ctx.db.query("mealPrices").first();
      if (existing) {
        await ctx.db.patch(existing._id, args);
      } else {
        await ctx.db.insert("mealPrices", args);
      }
    },
  });