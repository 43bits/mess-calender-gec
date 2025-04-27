import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const syncUser = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    clerkId: v.string(),
    image: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existingUser = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("clerkId"), args.clerkId))
      .first();

    if (existingUser) return;

    return await ctx.db.insert("users", {
      ...args,
      role: "student",
    });
  },
});

export const getUsers = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("User is not authenticated");

    const users = await ctx.db.query("users").collect();
    return users;
  },
});

export const getUserByClerkId = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    if (!args.clerkId) throw new Error("clerkId is required");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (!user) throw new Error("User not found");
    return user;
  },
});

export const updateUserRole = mutation({
  args: {
    userId: v.id("users"), // Changed from v.string() to v.id("users")
    role: v.union(v.literal("admin"), v.literal("student"))
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Verify admin status
    const admin = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", q => q.eq("clerkId", identity.subject))
      .filter(q => q.eq(q.field("role"), "admin"))
      .first();

    if (!admin) {
      throw new Error("Not authorized - admin only");
    }

    // Update user role
    return await ctx.db.patch(args.userId, {
      role: args.role ?? "student",
      updatedAt: new Date().toISOString(),
      updatedBy: identity.subject
    });
  }
});

// Schema validation helper
export const userSchema = {
  clerkId: v.string(),
  name: v.string(),
  email: v.string(),
  role: v.union(v.literal("admin"), v.literal("student")),
  image: v.optional(v.string()),
  createdAt: v.string(),
  updatedAt: v.string(),
  updatedBy: v.optional(v.string())
};