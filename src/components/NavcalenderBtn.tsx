"use client";

import Link from "next/link";
import { Button } from "./ui/button";
import { ClipboardCheck, SparklesIcon } from "lucide-react";
import { useUserRole } from "@/hooks/useUserRole";

function DasboardBtn() {
  const { isAdmin, isLoading } = useUserRole();

  if (isAdmin || isLoading) return null;

  return (
    <Link href={"/calculate-meal"}>
      <Button className="gap-2 font-medium" size={"sm"}>
        <ClipboardCheck className="size-4" />
        Calender
      </Button>
    </Link>
  );
}
export default DasboardBtn;