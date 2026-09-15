import type { ReactNode } from "react";
import { HexColorInput, HexColorPicker } from "react-colorful";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";

type ColorPickerPopoverProps = {
  /** Current hex colour (e.g. "#3b82f6"). */
  value: string;
  /** Fires continuously while dragging — wire to live state. */
  onChange: (value: string) => void;
  /** Mirrors the popover open state (used to preview on the board behind). */
  onOpenChange?: (open: boolean) => void;
  /** The swatch that opens the picker. */
  children: ReactNode;
  align?: "start" | "center" | "end";
};

/**
 * In-app colour picker (saturation square + hue bar + hex field) in a popover,
 * replacing the OS-native `<input type="color">` so it matches the app's UI.
 */
export function ColorPickerPopover({
  value,
  onChange,
  onOpenChange,
  children,
  align = "center",
}: ColorPickerPopoverProps) {
  return (
    <Popover onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent align={align} className="w-72 space-y-3">
        <HexColorPicker
          color={value}
          onChange={onChange}
          className="pt-colorful"
        />
        <div className="flex items-center gap-2">
          <span
            className="h-8 w-8 shrink-0 rounded-full ring-1 ring-line"
            style={{ backgroundColor: value }}
          />
          <HexColorInput
            color={value}
            onChange={onChange}
            prefixed
            className="min-w-0 flex-1 rounded-[0.6rem] bg-surface-muted px-3 py-2 text-sm font-medium uppercase text-ink outline-none transition-colors focus:bg-surface-sunken focus:ring-2 focus:ring-accent/40"
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}
