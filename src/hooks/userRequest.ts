import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useUser } from "@clerk/nextjs";

export function useMealRequests() {
  const { user } = useUser();
  // Defensive: only use if user.id is a non-empty string
  const clerkId = typeof user?.id === "string" && user.id.length > 0 ? user.id : undefined;
  const sendRequest = useMutation(api.mealRequests.sendRequest);
 
  const requests = useQuery(api.mealRequests.getRequestsForStudent, {
      clerkId: user?.id || "",
    });


  return { sendRequest, requests };
}