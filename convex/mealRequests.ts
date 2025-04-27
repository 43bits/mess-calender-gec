import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
export const sendRequest = mutation({
  args: {
    clerkId: v.string(),
    meal: v.string(),
    date: v.string(),
    reason: v.optional(v.string()),
    type: v.optional(v.union(v.literal("veg"), v.literal("non-veg"))), // <-- add this
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity || identity.subject !== args.clerkId) throw new Error("Not authorized");
    await ctx.db.insert("mealRequests", {
      ...args,
      status: "pending",
      createdAt: new Date().toISOString(),
    });
  },
});

export const clearAcceptedRequests = mutation({
  handler: async (ctx) => {
    // Get all requests with status "approved"
    const accepted = await ctx.db
      .query("mealRequests")
      .filter(q => q.eq(q.field("status"), "approved"))
      .collect();

    for (const req of accepted) {
      await ctx.db.delete(req._id);
    }
    return { success: true, deleted: accepted.length };
  },
});

export const getRequestsForAdmin = query({
  handler: async (ctx) => {
    const requests = await ctx.db.query("mealRequests").collect();
    // Fetch all users
    const users = await ctx.db.query("users").collect();
    // Map clerkId to user name
    const userMap = Object.fromEntries(users.map(u => [u.clerkId, u.name]));
    // Attach name to each request
    return requests.map(req => ({
      ...req,
      studentName: userMap[req.clerkId] || "Unknown",
    }));
  },
});

export const getRequestsForStudent = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("mealRequests")
      .filter((q) => q.eq(q.field("clerkId"), args.clerkId))
      .collect();
  },
});

export const acceptRequest = mutation({
  args: { requestId: v.id("mealRequests") },
  handler: async (ctx, args) => {
    // Get the request
    const request = await ctx.db.get(args.requestId);
    if (!request) throw new Error("Request not found");

    // Mark the meal for the student (default to "veg")
    const mealKey = `${request.date}-${request.meal}`;
    const now = new Date().toISOString();

    // Check if already marked
    const existing = await ctx.db
      .query("mealSelections")
      .withIndex("by_clerk_id", q => q.eq("clerkId", request.clerkId))
      .filter(q => q.eq(q.field("key"), mealKey))
      .first();

      if (existing) {
        // Update the existing meal selection with the new type
        await ctx.db.patch(existing._id, {
          type: request.type ?? "veg",
          updatedAt: now,
          updatedBy: "admin",
          adminModified: true,
        });
        await ctx.db.patch(args.requestId, { status: "approved" });
        return;
      }

    // Insert meal selection as "veg" (or extend to allow admin to choose)
    await ctx.db.insert("mealSelections", {
      key: mealKey,
      type: request.type ?? "veg", // or "non-veg" if you want to allow admin to choose
      clerkId: request.clerkId,
      meal: request.meal as "breakfast" | "lunch" | "dinner", // <-- fix here
      amount:  request.meal === "breakfast" ? 50 : request.meal === "lunch" ? 70 : 70, // adjust if needed
      year: parseInt(request.date.split("-")[0]),
      month: parseInt(request.date.split("-")[1]),
      day: parseInt(request.date.split("-")[2]),
      createdAt: now,
      createdBy: "admin",
      updatedAt: now,
      updatedBy: "admin",
      adminCreated: true,
      adminModified: true,
      selections: {},
      
    });

    // Update request status
    await ctx.db.patch(args.requestId, { status: "approved" });
  },
});

