import { Calendar, ClipboardList, Clock, CookieIcon, Users } from "lucide-react";

export const MEAL_TIMINGS = {
  BREAKFAST: {
    DEADLINE: {
      HOUR: 21, // 9 PM previous day
      MINUTE: 0,
    },
    SERVING_TIME: {
      START: 7, // 7 AM
      END: 9,   // 9 AM
    },
  },
  LUNCH: {
    DEADLINE: {
      HOUR: 12, // 12 PM same day
      MINUTE: 0,
    },
    SERVING_TIME: {
      START: 13, // 1 PM
      END: 14,   // 2 PM
    },
  },
  DINNER: {
    DEADLINE: {
      HOUR: 19, // 7 PM same day
      MINUTE: 0,
    },
    SERVING_TIME: {
      START: 20, // 8 PM
      END: 21,   // 9 PM
    },
  },
} as const;

// Corrected meal marking logic
export const isMealMarkingAllowed = (date: Date, meal: string): boolean => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const targetDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  // If the date is in the past (before today), marking is not allowed
  if (targetDate < today) {
    return false;
  }

  switch (meal) {
    case "breakfast": {
      // Deadline is 9 PM previous day
      const deadline = new Date(targetDate);
      deadline.setDate(deadline.getDate() - 1);
      deadline.setHours(MEAL_TIMINGS.BREAKFAST.DEADLINE.HOUR, MEAL_TIMINGS.BREAKFAST.DEADLINE.MINUTE, 0, 0);
      return now <= deadline;
    }
    case "lunch": {
      // Deadline is 12 PM same day
      const deadline = new Date(targetDate);
      deadline.setHours(MEAL_TIMINGS.LUNCH.DEADLINE.HOUR, MEAL_TIMINGS.LUNCH.DEADLINE.MINUTE, 0, 0);
      return now <= deadline;
    }
    case "dinner": {
      // Deadline is 7 PM same day
      const deadline = new Date(targetDate);
      deadline.setHours(MEAL_TIMINGS.DINNER.DEADLINE.HOUR, MEAL_TIMINGS.DINNER.DEADLINE.MINUTE, 0, 0);
      return now <= deadline;
    }
    default:
      return false;
  }
};

export const getMealStatus = (date: Date, meal: string): {
  status: "open" | "closed" | "upcoming";
  message: string;
} => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const targetDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  if (targetDate < today) {
    return { status: "closed", message: "Marking closed (Past date)" };
  }

  switch (meal) {
    case "breakfast": {
      // Deadline is 9 PM previous day
      const deadline = new Date(targetDate);
      deadline.setDate(deadline.getDate() - 1);
      deadline.setHours(MEAL_TIMINGS.BREAKFAST.DEADLINE.HOUR, MEAL_TIMINGS.BREAKFAST.DEADLINE.MINUTE, 0, 0);
      if (now <= deadline) {
        return { status: "open", message: "Mark before 9 PM previous day" };
      }
      return { status: "closed", message: "Marking closed for breakfast" };
    }
    case "lunch": {
      // Deadline is 12 PM same day
      const deadline = new Date(targetDate);
      deadline.setHours(MEAL_TIMINGS.LUNCH.DEADLINE.HOUR, MEAL_TIMINGS.LUNCH.DEADLINE.MINUTE, 0, 0);
      if (now <= deadline) {
        return { status: "open", message: "Mark before 12 PM" };
      }
      return { status: "closed", message: "Marking closed for lunch" };
    }
    case "dinner": {
      // Deadline is 7 PM same day
      const deadline = new Date(targetDate);
      deadline.setHours(MEAL_TIMINGS.DINNER.DEADLINE.HOUR, MEAL_TIMINGS.DINNER.DEADLINE.MINUTE, 0, 0);
      if (now <= deadline) {
        return { status: "open", message: "Mark before 7 PM" };
      }
      return { status: "closed", message: "Marking closed for dinner" };
    }
    default:
      return { status: "closed", message: "Invalid meal type" };
  }
};

export const quickActions = [
  {
    title: "Menu Card",
    description: "View weekly mess menu",
    icon: ClipboardList,
    gradient: "from-blue-500/10 via-blue-500/5 to-transparent",
    color: "blue",
    href: "#",
  },
] as const;

export type QuickActionType = (typeof quickActions)[number];