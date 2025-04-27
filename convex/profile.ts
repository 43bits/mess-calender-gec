import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const updateProfile = mutation({
  args: {
    gender: v.union(v.literal("boy"), v.literal("girl")),
    hostel: v.string(),
    year: v.union(v.literal("FE"), v.literal("SE"), v.literal("TE"), v.literal("BE")),
    branch: v.union(
      v.literal("COM"),
      v.literal("IT"),
      v.literal("VSLI"),
      v.literal("CIVIL"),
      v.literal("MECH"),
      v.literal("ETC"),
      v.literal("ENE"),
      v.literal("MINING")
    ),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", q => q.eq("clerkId", identity.subject))
      .first();

    if (!user) throw new Error("User not found");

    await ctx.db.patch(user._id, {
      gender: args.gender,
      hostel: args.hostel,
      year: args.year,
      branch: args.branch,
      updatedAt: new Date().toISOString(),
    });

    return { success: true };
  },
});