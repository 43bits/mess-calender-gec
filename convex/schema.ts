import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    name: v.string(),
    email: v.string(),
    clerkId: v.string(),
    image: v.optional(v.string()),
    role: v.union(v.literal("admin"), v.literal("student")),
    gender: v.optional(v.union(v.literal("boy"), v.literal("girl"))), // <-- add
    hostel: v.optional(v.string()),
    year: v.optional(v.union(v.literal("FE"), v.literal("SE"), v.literal("TE"), v.literal("BE"))), // <-- add
    branch: v.optional(
    v.union(
      v.literal("COM"),
      v.literal("IT"),
      v.literal("VSLI"),
      v.literal("CIVIL"),
      v.literal("MECH"),
      v.literal("ETC"),
      v.literal("ENE"),
      v.literal("MINING")
    )
  ), // <-- add
    createdAt: v.optional(v.string()),
    updatedAt: v.optional(v.string()),
    createdBy: v.optional(v.string()),
    updatedBy: v.optional(v.string()),
  })
  .index("by_clerk_id", ["clerkId"]),
   // Add index for querying by role
  
  mealSelections: defineTable({
    key: v.string(),
    type: v.union(v.literal("veg"), v.literal("non-veg")),
    clerkId: v.optional(v.string()),
    // lastUpdated: v.string(),
    // selections: v.record(v.string(), v.union(v.literal("veg"), v.literal("non-veg"))),
    selections: v.optional(v.record(v.string(), v.union(v.literal("veg"), v.literal("non-veg")))),
    meal: v.optional(v.union(v.literal("breakfast"), v.literal("lunch"), v.literal("dinner"))),
    amount: v.optional(v.float64()), // Made optional
    year: v.optional(v.float64()),   // Made optional
    month: v.optional(v.float64()),  // Made optional
    day: v.optional(v.float64()),
   
    createdAt: v.string(),
    updatedAt: v.string(),
    createdBy: v.string(),
    updatedBy: v.string(),
    adminCreated: v.optional(v.boolean()),
    adminModified: v.optional(v.boolean())
  })
  .index("by_clerk_id", ["clerkId"])
  .index("by_key", ["key"])
  .index("by_date", ["year", "month", "day"]),

  mealRequests: defineTable({
    clerkId: v.string(),
    meal: v.string(),
    date: v.string(),
    reason: v.optional(v.string()),
    type: v.optional(v.union(v.literal("veg"), v.literal("non-veg"))), // <-- add this
    status: v.string(), // "pending", "approved", "rejected"
    createdAt: v.string(),
  })
  .index("by_clerk_id", ["clerkId"])
  .index("by_date", ["date"]),

  menu: defineTable({
    data: v.any(), // Store the whole menu object
    updatedAt: v.string(),
    updatedBy: v.string(),
  }),
  mealPrices: defineTable({
    breakfast: v.float64(),
    lunchVeg: v.float64(),
    lunchNonVeg: v.float64(),
    dinnerVeg: v.float64(),
    dinnerNonVeg: v.float64(),
  }),
});