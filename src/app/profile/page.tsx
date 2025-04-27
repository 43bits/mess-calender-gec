"use client";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { useState, useEffect } from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useUserRole } from "@/hooks/useUserRole";

const hostelOptions = {
  boy: ["Boys Hostel 1", "Boys Hostel 2", "Boys Hostel 3", "Boys Hostel 4", "Boys Hostel 5"],
  girl: ["Girls Hostel"],
};
const yearOptions = ["FE", "SE", "TE", "BE"];
const branchOptions = [
  "COM", "IT", "VSLI", "CIVIL", "MECH", "ETC", "ENE", "MINING"
];

export default function ProfilePage() {
  const { user, isLoaded } = useUser();
  const { isAdmin, isLoading: isRoleLoading } = useUserRole();
  const updateProfile = useMutation(api.profile.updateProfile);
  const dbUser = useQuery(
    api.users.getUserByClerkId,
    user?.id ? { clerkId: user.id } : "skip"
  );

  // Pre-fill from dbUser if available
  const [gender, setGender] = useState<"boy" | "girl">("boy");
  const [hostel, setHostel] = useState(hostelOptions["boy"][0]);
  const [year, setYear] = useState("FE");
  const [branch, setBranch] = useState("COM");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (dbUser) {
      setGender((dbUser.gender as "boy" | "girl") || "boy");
      setHostel(dbUser.hostel || hostelOptions["boy"][0]);
      setYear(dbUser.year || "FE");
      setBranch(dbUser.branch || "COM");
    }
  }, [dbUser]);

  const handleGenderChange = (g: "boy" | "girl") => {
    setGender(g);
    setHostel(hostelOptions[g][0]);
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage("");
    try {
      await updateProfile({ gender, hostel, year: year as "FE" | "SE" | "TE" | "BE", branch: branch as "COM" | "IT" | "VSLI" | "CIVIL" | "MECH" | "ETC" | "ENE" | "MINING" });
      setMessage("Profile updated!");
    } catch {
      setMessage("Failed to update profile.");
    }
    setSaving(false);
  };

  if (!isLoaded || isRoleLoading) return <div>Loading...</div>;

  return (
    <div className="max-w-md mx-auto mt-8 p-4 border rounded bg-background">
      <div className="flex flex-col items-center mb-6">
        <Avatar className="h-20 w-20 mb-2">
          <AvatarImage src={user?.imageUrl} />
          <AvatarFallback>
            {user?.firstName?.[0]?.toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="text-lg font-semibold">{user?.fullName}</div>
      </div>
      {/* Only show the form if NOT admin */}
      {!isAdmin && (
        <>
          <div className="mb-4">
            <label className="block mb-1">Gender</label>
            <select
              value={gender}
              onChange={e => handleGenderChange(e.target.value as "boy" | "girl")}
              className="select select-bordered w-full"
            >
              <option value="boy">Boy</option>
              <option value="girl">Girl</option>
            </select>
          </div>
          <div className="mb-4">
            <label className="block mb-1">Hostel</label>
            <select
              value={hostel}
              onChange={e => setHostel(e.target.value)}
              className="select select-bordered w-full"
            >
              {hostelOptions[gender].map(h => (
                <option key={h} value={h}>{h}</option>
              ))}
            </select>
          </div>
          <div className="mb-4">
            <label className="block mb-1">Year</label>
            <select
              value={year}
              onChange={e => setYear(e.target.value)}
              className="select select-bordered w-full"
            >
              {yearOptions.map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
          <div className="mb-4">
            <label className="block mb-1">Branch</label>
            <select
              value={branch}
              onChange={e => setBranch(e.target.value)}
              className="select select-bordered w-full"
            >
              {branchOptions.map(b => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>
          <button
            className="btn btn-primary w-full"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? "Saving..." : "Save"}
          </button>
          {message && <div className="mt-2 text-sm text-center">{message}</div>}
        </>
      )}
    </div>
  );
}