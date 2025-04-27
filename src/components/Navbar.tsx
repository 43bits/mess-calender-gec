"use client";
import Link from "next/link";
import { ModeToggle } from "./ModeToggle";
import { SignInButton, SignUpButton, UserButton, useUser } from "@clerk/nextjs";
import DasboardBtn from "./NavcalenderBtn";
import { CookingPot, Menu } from "lucide-react";
import { Button } from "./ui/button";
import NotificationBtn from "./NavNotification";
import { useState } from "react";

// ...existing imports...

function Navbar() {
  const { isSignedIn } = useUser();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="border-b">
      <div className="flex h-16 items-center px-4 container mx-auto">
        {/* LEFT SIDE - LOGO */}
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="flex items-center gap-2 font-semibold text-2xl mr-6 font-mono hover:opacity-80 transition-opacity"
          >
            <CookingPot className="size-8 text-emerald-500" />
            <span className="bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">
              MessCalender
            </span>
          </Link>
        </div>

        {/* ModeToggle and UserButton always visible */}
        <div className="ml-auto flex items-center gap-2">
          <ModeToggle />
          <UserButton afterSignOutUrl="/" />
        </div>

        {/* Hamburger menu for mobile */}
        <button
          className="ml-2 sm:hidden"
          onClick={() => setMobileMenuOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          <Menu className="w-7 h-7" />
        </button>

        {/* Desktop actions */}
        <div className="hidden sm:flex items-center gap-4 ml-2">
          {isSignedIn ? (
            <>
              <DasboardBtn />
              <NotificationBtn />
              <Link href={"/profile"}>
                <Button className="gap-2 font-medium" size={"sm"}>
                  Profile
                </Button>
              </Link>
            </>
          ) : (
            <>
              <SignInButton>
                <Button
                  variant={"outline"}
                  className="border-primary/50 text-primary hover:text-white hover:bg-primary/10"
                >
                  Sign In
                </Button>
              </SignInButton>
              <SignUpButton>
                <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                  Sign Up
                </Button>
              </SignUpButton>
            </>
          )}
        </div>

        {mobileMenuOpen && (
         <div className="absolute top-16 left-0 w-full bg-background border-b shadow-md flex flex-col items-start gap-2 px-4 py-3 sm:hidden z-50">
          {isSignedIn ? (
            <>
              <Link href="/dashboard" className="w-full">
              <Button className="gap-2 font-medium w-full mb-1" size="sm">
              {/* You can use an icon here if DasboardBtn is just an icon, or text */}
              Dashboard
              </Button>
              </Link>
              <NotificationBtn />
              <Link href={"/profile"} className="w-full">
              <Button className="gap-2 font-medium w-full mb-1" size="sm">
              Profile
              </Button>
              </Link>
              {/* UserButton REMOVED from here */}
          </>
          ) : (
              <>
                <SignInButton>
                  <Button
                    variant={"outline"}
                    className="border-primary/50 text-primary hover:text-white hover:bg-primary/10 w-full mb-1"
                  >
                    Sign In
                  </Button>
                </SignInButton>
                <SignUpButton>
                  <Button className="bg-primary text-primary-foreground hover:bg-primary/90 w-full">
                    Sign Up
                  </Button>
                </SignUpButton>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}

export default Navbar;