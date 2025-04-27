"use client";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { useUserRole } from "@/hooks/useUserRole";

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  approved: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
};

const typeColors: Record<string, string> = {
  veg: "bg-green-100 text-green-800",
  "non-veg": "bg-red-100 text-red-800",
};

export default function NotificationsPage() {
  const requests = useQuery(api.mealRequests.getRequestsForAdmin) || [];
  const acceptRequest = useMutation(api.mealRequests.acceptRequest);
  const clearAccepted = useMutation(api.mealRequests.clearAcceptedRequests); // <-- add this
  const { isAdmin, isLoading: isRoleLoading } = useUserRole();

  const handleAccept = async (requestId: string) => {
    await acceptRequest({ requestId: requestId as Id<"mealRequests"> });
  };
  const handleClearAccepted = async () => {
    await clearAccepted();
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
    <div className="container max-w-2xl mx-auto py-10">
      <h1 className="text-2xl font-bold mb-6 flex items-center justify-between">
        Meal Marking Requests
        <button
          className="ml-4 px-3 py-1 rounded bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition"
          onClick={handleClearAccepted}
        >
          Clear All Accepted
        </button>
      </h1>
      {requests.length === 0 ? (
        <div className="text-muted-foreground">No requests.</div>
      ) : (
        <div className="space-y-4">
          {[...requests].reverse().map((req) => (
            <div
              key={req._id}
              className="rounded-lg border p-6 bg-card shadow-sm flex flex-col gap-3"
            >
              {/* ...existing notification content... */}
              <div className="flex flex-wrap gap-4 items-center justify-between">
                <div>
                  <div className="font-semibold text-lg">
                    {req.meal.charAt(0).toUpperCase() + req.meal.slice(1)} on {req.date}
                  </div>
                  <div className="text-sm text-muted-foreground">
                  <span className="font-semibold">{req.studentName}</span>
                  <span className="ml-2">({req.clerkId})</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <span
                    className={`px-2 py-1 rounded text-xs font-semibold ${
                      req.type && typeColors[req.type] ? typeColors[req.type] : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {req.type ? (req.type === "veg" ? "Veg" : "Non-Veg") : "Not specified"}
                  </span>
                  <span
                    className={`px-2 py-1 rounded text-xs font-semibold ${statusColors[req.status] || "bg-gray-100 text-gray-800"}`}
                  >
                    {req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                  </span>
                </div>
              </div>
              {req.reason && (
                <div className="text-sm">
                  <b>Reason:</b> {req.reason}
                </div>
              )}
              {req.status === "pending" && (
                <button
                  className="mt-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded font-semibold transition"
                  onClick={() => handleAccept(req._id)}
                >
                  Accept & Mark
                </button>
              )}
              {req.status === "approved" && (
                <span className="mt-2 text-green-600 font-semibold">Approved</span>
              )}
              {req.status === "rejected" && (
                <span className="mt-2 text-red-600 font-semibold">Rejected</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}