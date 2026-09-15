import "react-day-picker/style.css";
import { vi } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker, type DayPickerProps } from "react-day-picker";
import { cn } from "../../lib/cn";

/** Month calendar themed to the app's tokens (see `.rdp-themed` in index.css). */
export function Calendar({ className, ...props }: DayPickerProps) {
  return (
    <DayPicker
      locale={vi}
      showOutsideDays
      className={cn("rdp-themed", className)}
      components={{
        Chevron: ({ orientation, ...p }) =>
          orientation === "left" ? (
            <ChevronLeft size={16} {...p} />
          ) : (
            <ChevronRight size={16} {...p} />
          ),
      }}
      {...props}
    />
  );
}
