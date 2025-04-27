"use client";

import Link from "next/link";
import { Button } from "./ui/button";
import { MessageSquareDot, SparklesIcon } from "lucide-react";
import { useUserRole } from "@/hooks/useUserRole";

function NotificationBtn() {
  const { isStudent, isLoading } = useUserRole();

  if (isStudent || isLoading) return null;

  return (
    <Link href={"/notifications"}>
      <Button className="gap-2 font-medium" size={"sm"}>
        <MessageSquareDot className="size-4" />
        Notification
      </Button>
    </Link>
  );
}
export default NotificationBtn;