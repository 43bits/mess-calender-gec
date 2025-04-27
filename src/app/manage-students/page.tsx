"use client";
import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Card } from "@/components/ui/card";
import { useUserRole } from "@/hooks/useUserRole";
import { useUser } from "@clerk/nextjs";

const months = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const mealPrices = {
  breakfast: 50,
  lunch: { veg: 70, "non-veg": 80 },
  dinner: { veg: 70, "non-veg": 80 },
} as const;

type MealType = "veg" | "non-veg";
type MealTime = "breakfast" | "lunch" | "dinner";

export default function ManageStudentsPage() {
  const { user: currentUser, isLoaded } = useUser();
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const { isAdmin, isLoading: isRoleLoading } = useUserRole();
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingUser, setLoadingUser] = useState<string | null>(null);
  const currentDate = new Date();
  const [month, setMonth] = useState(currentDate.getMonth());
  const [year, setYear] = useState(currentDate.getFullYear());
  // Hostel filter state
  const [hostelFilter, setHostelFilter] = useState<string>("All");
  const hostelList = [
    "All",
    "Boys Hostel 1",
    "Boys Hostel 2",
    "Boys Hostel 3",
    "Boys Hostel 4",
    "Boys Hostel 5",
    "Girls Hostel",
  ];

  const updateMealSelection = useMutation(api.mealSelections.update);

  // Fetch users only when Clerk is loaded and user is present
  const users = useQuery(
    api.users.getUsers,
    isLoaded && currentUser ? {} : undefined
  );

  // Hostel filter
  const filteredUsersByHostel = users?.filter(
    user =>
      hostelFilter === "All" ||
      user.hostel === hostelFilter
  );

  // Filter out the current user from the list
  const filteredUsers = filteredUsersByHostel?.filter(
    user => user.email !== currentUser?.emailAddresses?.[0]?.emailAddress
  );

  // Find the selected user object
  const selectedUserObj = useMemo(() => {
    if (!users || !selectedUser) return undefined;
    return users.find(u => u._id === selectedUser);
  }, [users, selectedUser]);

  // Get the clerkId for the selected user
  const selectedUserClerkId =
    selectedUserObj && typeof selectedUserObj.clerkId === "string" && selectedUserObj.clerkId.length > 0
      ? selectedUserObj.clerkId
      : undefined;

  // Only call useQuery if we have a valid clerkId
  const selectedUserMeals = useQuery(
    api.mealSelections.getUserMeals,
    selectedUserClerkId ? { userId: selectedUserClerkId } : "skip" 
  );

  useEffect(() => {
    if (selectedUserMeals && loadingUser === selectedUser) {
      setLoadingUser(null);
    }
  }, [selectedUserMeals, loadingUser, selectedUser]);

  const handleUserSelect = (userId: string) => {
    setSelectedUser(userId);
    setLoadingUser(userId);
    setError(null);
  };

  const calculateMealPrice = (meal: MealTime, type: MealType): number => {
    if (meal === "breakfast") return mealPrices.breakfast;
    return mealPrices[meal][type];
  };

  const toggleMeal = async (dateKey: string, meal: MealTime) => {
    if (!selectedUserClerkId || isUpdating) return;

    const key = `${dateKey}-${meal}`;
    const current = selectedUserMeals?.selections[key];
    let next: MealType | undefined;

    if (!current) next = "veg";
    else if (current === "veg") next = "non-veg";
    else next = undefined;

    try {
      setIsUpdating(true);
      setError(null);

      await updateMealSelection({
        key,
        type: next,
        clerkId: selectedUserClerkId,
        isAdminAction: true,
        adminId: currentUser?.id
      });

      // Optionally: optimistic UI update here
    } catch (error) {
      setError("Failed to update meal selection.");
    } finally {
      setIsUpdating(false);
    }
  };

  const renderMealCell = (dateKey: string, meal: MealTime, mealType?: MealType) => {
    const isToday =
      dateKey ===
      `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}-${String(currentDate.getDate()).padStart(2, "0")}`;

    return (
      <div
        key={meal}
        onClick={() => toggleMeal(dateKey, meal)}
        className={`mt-1 p-1 rounded text-xs transition-colors ${
          mealType === "veg"
            ? "bg-emerald-500/80 dark:bg-emerald-600/80 text-white"
            : mealType === "non-veg"
            ? "bg-rose-500/80 dark:bg-rose-600/80 text-white"
            : "bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600"
        } ${isUpdating ? "opacity-50 cursor-wait" : "cursor-pointer"}
        ${isToday ? "ring-2 ring-blue-500" : ""}`}
      >
        <div className="flex items-center justify-between">
          <span>{meal}</span>
          {mealType && (
            <span className="text-[10px] font-medium">
              ({mealType === "veg" ? "V" : "NV"})
              <span className="ml-1">
                ₹{calculateMealPrice(meal as MealTime, mealType)}
              </span>
            </span>
          )}
        </div>
      </div>
    );
  };

  const calculatedTotals = useMemo(() => {
    if (!selectedUserMeals?.selections) return {
      monthTotal: 0,
      monthDetails: {
        totalAmount: 0,
        breakfastCount: 0,
        vegLunchCount: 0,
        nonVegLunchCount: 0,
        vegDinnerCount: 0,
        nonVegDinnerCount: 0
      }
    };
  
    let details = {
      totalAmount: 0,
      breakfastCount: 0,
      vegLunchCount: 0,
      nonVegLunchCount: 0,
      vegDinnerCount: 0,
      nonVegDinnerCount: 0
    };
  
    Object.entries(selectedUserMeals.selections).forEach(([key, type]) => {
      // key format: YYYY-MM-DD-meal
      const [y, m, d, meal] = key.split("-");
      if (Number(y) === year && Number(m) === month + 1) {
        if (meal === "breakfast") {
          details.breakfastCount++;
          details.totalAmount += mealPrices.breakfast;
        } else if (meal === "lunch") {
          if (type === "veg") {
            details.vegLunchCount++;
            details.totalAmount += mealPrices.lunch.veg;
          } else if (type === "non-veg") {
            details.nonVegLunchCount++;
            details.totalAmount += mealPrices.lunch["non-veg"];
          }
        } else if (meal === "dinner") {
          if (type === "veg") {
            details.vegDinnerCount++;
            details.totalAmount += mealPrices.dinner.veg;
          } else if (type === "non-veg") {
            details.nonVegDinnerCount++;
            details.totalAmount += mealPrices.dinner["non-veg"];
          }
        }
      }
    });
  
    return {
      monthTotal: details.totalAmount,
      monthDetails: details
    };
  }, [selectedUserMeals, month, year]);


  // Calculate half-year and overall totals
const calculatedHalfYearTotals = useMemo(() => {
  if (!selectedUserMeals?.selections) return { total: 0 };
  let total = 0;
  Object.entries(selectedUserMeals.selections).forEach(([key, type]) => {
    // key format: YYYY-MM-DD-meal
    const [y, m] = key.split("-");
    // Half-year: Jan-Jun (1-6) or Jul-Dec (7-12) based on current month
    const half = month < 6 ? [1, 2, 3, 4, 5, 6] : [7, 8, 9, 10, 11, 12];
    if (Number(y) === year && half.includes(Number(m))) {
      const meal = key.split("-")[3];
      if (meal === "breakfast") total += mealPrices.breakfast;
      else if (meal === "lunch") total += mealPrices.lunch[type];
      else if (meal === "dinner") total += mealPrices.dinner[type];
    }
  });
  return { total };
}, [selectedUserMeals, month, year]);

const calculatedOverallTotals = useMemo(() => {
  if (!selectedUserMeals?.selections) return { total: 0 };
  let total = 0;
  Object.entries(selectedUserMeals.selections).forEach(([key, type]) => {
    const meal = key.split("-")[3];
    if (meal === "breakfast") total += mealPrices.breakfast;
    else if (meal === "lunch") total += mealPrices.lunch[type];
    else if (meal === "dinner") total += mealPrices.dinner[type];
  });
  return { total };
}, [selectedUserMeals]);

  if (!isLoaded || isRoleLoading) {
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
  if(!users || users.length === 0) {
    return (
      <div className="container mx-auto p-4">
        <div className="text-center text-muted-foreground">
          No students registered yet.
        </div>
      </div>
    );
  }
  // if (isLoading) return <LoaderUI />;
  return (
    <div className="container mx-auto p-2 sm:p-4">
      <div className="flex flex-col sm:flex-row h-auto sm:h-[80vh] gap-4 rounded-lg border">
        {/* Hostel Filter */}
        <div className="w-full sm:w-80 border-b sm:border-b-0 sm:border-r bg-muted/10">
          <div className="p-4">
            <h2 className="text-xl font-semibold mb-2">Students</h2>
            <div className="mb-2">
              <select
                value={hostelFilter}
                onChange={e => setHostelFilter(e.target.value)}
                className="select select-bordered w-full bg-background text-foreground dark:bg-muted dark:text-foreground"
              >
                {hostelList.map(h => (
                  <option key={h} value={h}>{h}</option>
                ))}
              </select>
            </div>
            <p className="text-sm text-muted-foreground">
              {filteredUsers?.length} students registered
            </p>
          </div>
          <Separator />
          <ScrollArea className="max-h-60 sm:h-[calc(80vh-5rem)]">
            <div className="space-y-1 p-2">
              {filteredUsers?.map((user) => (
                <button
                  key={user._id}
                  onClick={() => handleUserSelect(user._id)}
                  disabled={loadingUser === user._id}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors ${
                    selectedUser === user._id ? "bg-muted" : ""
                  } ${loadingUser === user._id ? "opacity-50 cursor-wait" : ""}`}
                >
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={user.image} />
                    <AvatarFallback>
                      {user.name?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 text-left">
                  <p className="text-sm font-medium truncate">{user.name}</p>
                  <p className="text-xs text-muted-foreground truncate">
                  {user.email}
                  </p>
                  <p className="text-xs text-muted-foreground">
                   {user.year} | {user.branch}
                   </p>
                  </div>
                  {loadingUser === user._id && (
                    <div className="loading loading-spinner loading-sm" />
                  )}
                </button>
              ))}
            </div>
          </ScrollArea>
        </div>
  
        {/* Calendar View */}
        <div className={`flex-1 p-2 sm:p-4 ${!selectedUser ? "hidden sm:block" : ""}`}>
          {selectedUser ? loadingUser === selectedUser ? (
            <div className="h-full flex items-center justify-center">
              <div className="loading loading-spinner loading-lg" />
            </div>
          ) : selectedUserMeals ? (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
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

              {error && (
                <div className="text-sm text-red-500 mb-4">
                  {error}
                </div>
              )}

              <Card className="p-6">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead className="bg-muted">
                      <tr>
                        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
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
                              cells.push(
                                <td key={j} className="border border-border p-2" />
                              );
                            } else {
                              const dateKey = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                              cells.push(
                                <td key={j} className="border border-border p-2 text-center">
                                  <div className="text-sm font-medium text-foreground">
                                    {day}
                                  </div>
                                  {(["breakfast", "lunch", "dinner"] as MealTime[]).map((meal) =>
                                    renderMealCell(
                                      dateKey,
                                      meal,
                                      selectedUserMeals.selections[`${dateKey}-${meal}`]
                                    )
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
              </Card>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                  <p className="text-2xl font-bold">₹{calculatedHalfYearTotals.total}</p>
                   <div className="text-sm text-muted-foreground mt-2">
                    <p>
                   {month < 6 ? "Jan-Jun" : "Jul-Dec"} {year}
                   </p>
                   </div>
                   </Card>
                    <Card className="p-4">
                   <h3 className="text-lg font-semibold">Overall Total</h3>
                   <p className="text-2xl font-bold">₹{calculatedOverallTotals.total}</p>
                    <div className="text-sm text-muted-foreground mt-2">
                  <p>All years</p>
                  </div>
                   </Card>
              </div>
            </div>
          ) : null : (
            <div className="h-full flex items-center justify-center text-muted-foreground">
              Select a student to view their meal data
            </div>
          )}
        </div>
      </div>
    </div>
  );
}