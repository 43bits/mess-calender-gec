"use client";
import { useUserRole } from '@/hooks/useUserRole';
import { ActionCard } from '@/components/ActionCard';
import { Calendar, Users, ClipboardCheck, Settings, History, CookingPot, BookMarked, Menu, MenuSquareIcon, MessageSquareDot } from 'lucide-react';
import { useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { Modal } from "@/components/Modal"; // Create this if you haven't
import SendRequestPage from "./send-request/page"; // Adjust path if needed

export default function Home() {
  // const { isAdmin, isStudent } = useUserRole();
  const [showSendRequestModal, setShowSendRequestModal] = useState(false);
  const { user, isLoaded } = useUser();
  const { isLoading, isAdmin, isStudent } = useUserRole();
  const router = useRouter();
  // Redirect to sign-in if not logged in
  if (isLoaded && !user) {
    router.replace("/sign-in"); // or Clerk's sign-in URL
    return null;
  }
  // Show loader while loading user or role
  if (!isLoaded || isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="loading loading-spinner loading-lg" />
      </div>
    );
  }

  return (
    <div className="container max-w-7xl mx-auto pt-0 px-4">
    <div className="rounded-lg bg-card p-6 border shadow-sm mb-10">
      <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">
        Welcome back!
      </h1>
      <p className="text-muted-foreground mt-2">
        {isStudent
          ? "Manage and mark your Daily Meal"
          : "view and manage all students meal marking easily"}
      </p>
    </div>


      {isAdmin ? (
        <>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <ActionCard
              title="Manage Students"
              description="View and manage all student meal markings"
              icon={Users}
              href="/manage-students"
              gradientFrom="blue-500"
              gradientTo="blue-600"
            />
            <ActionCard
              title="Todays Order"
              description="View Today's No. of meal to prepare"
              icon={Calendar}
              href="/daily-order"
              gradientFrom="emerald-500"
              gradientTo="emerald-600"
            />
            <ActionCard
              title="View Request"
              description="late marking student request"
              icon={MessageSquareDot}
              href="/notifications"
              gradientFrom="emerald-500"
              gradientTo="emerald-600"
            />
            <ActionCard
              title="Meal Settings"
              description="Configure meal timings and options"
              icon={Settings}
              href="/meal-settings"
              gradientFrom="purple-500"
              gradientTo="purple-600"
            />
          </div>
        </>
      ) : (
        <>
          <div className="mb-6">
            <h1 className="text-3xl font-bold">Your Meal Dashboard</h1>
            <p className="text-muted-foreground mt-1">Mark your meals on time</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <ActionCard
              title="Mark Meals"
              description="Mark your daily meals for breakfast, lunch, and dinner"
              icon={ClipboardCheck}
              href="/calculate-meal"
              gradientFrom="emerald-500"
              gradientTo="emerald-600"
            />
            <ActionCard
            title="Late marking request"
            description="Forgot to mark? Send request to admin"
            icon={History}
            onClick={() => setShowSendRequestModal(true)}
             gradientFrom="orange-500"
             gradientTo="orange-600"
            />

             <ActionCard
              title="MENU-Card"
              description="see whats cokking today"
              icon={MenuSquareIcon}
              href="/menu-card"
              gradientFrom="orange-500"
              gradientTo="orange-600"
            />
          
            
          </div>
          <Modal open={showSendRequestModal} onClose={() => setShowSendRequestModal(false)}>
          <SendRequestPage />
          </Modal>
          {/* MenuCard component stays at root level */}
          
        </>
      )}
    </div>
    

  );
};