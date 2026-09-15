import { uiText } from "../lib/messages";
import { Check } from "lucide-react";
import { cn } from "../lib/cn";
import { publicAssetUrl } from "../lib/public-asset";
import {
  BACKGROUND_COLORS,
  BACKGROUNDS,
  clampBackgroundColor,
  isColorBackground,
  isCustomColor,
  PRIMARY_COLORS,
  type Settings,
} from "../lib/settings";
import { ColorPickerPopover } from "./ui/color-picker";
import { FieldLabel } from "./form-controls";
import { Tooltip } from "./ui/tooltip";
/**
 * Rainbow shown on the "pick a custom colour" swatch. A horizontal linear
 * sweep reads clearly at any aspect ratio (a conic gradient collapses to one
 * colour on a short pill).
 */
const RAINBOW =
  "linear-gradient(90deg, #f43f5e, #fb923c, #f59e0b, #84cc16, #10b981, #3b82f6, #8b5cf6, #ec4899)";
type AppearanceControlsProps = {
  settings: Settings;
  onUpdate: (patch: Partial<Settings>) => void;
  /** Toggled true/false while a native colour picker is open (for live preview). */
  onPreview?: (active: boolean) => void;
};
/** Primary-colour and background pickers, each with a custom-colour option. */
export function AppearanceControls({
  settings,
  onUpdate,
  onPreview,
}: AppearanceControlsProps) {
  const customPrimary = isCustomColor(settings.primary, PRIMARY_COLORS);
  const customBg = isCustomColor(settings.background, BACKGROUND_COLORS);
  return (
    <>
      <div>
        <FieldLabel>{uiText("Màu chủ đạo")}</FieldLabel>
        <div className="flex flex-wrap gap-2">
          {PRIMARY_COLORS.map((c) => (
            <Tooltip key={c.value} label={uiText(c.name)}>
              <ColorSwatch
                color={c.value}
                selected={settings.primary === c.value}
                ariaLabel={uiText(c.name)}
                onClick={() => onUpdate({ primary: c.value })}
              />
            </Tooltip>
          ))}
          <CustomColorControl
            value={settings.primary}
            active={customPrimary}
            onChange={(v) => onUpdate({ primary: v })}
            onPreview={onPreview}
            className="h-9 rounded-full px-3"
          />
        </div>
      </div>

      <div>
        <FieldLabel>{uiText("Nền")}</FieldLabel>
        {/* Photos, solid colours, and a custom picker share one tile grid.
            Height shows ~2.5 rows so the next row peeks — a clear scroll hint. */}
        <div className="grid max-h-64 grid-cols-3 gap-2 overflow-y-auto p-0.5">
          {BACKGROUNDS.map((bg) => (
            <Tooltip key={uiText(bg.name)} label={uiText(bg.name)}>
              <button
                type="button"
                aria-label={uiText(bg.name)}
                onClick={() => onUpdate({ background: bg.value })}
                className={cn(
                  "relative aspect-video overflow-hidden rounded-[var(--radius-inner)] bg-surface-muted ring-2 transition",
                  settings.background === bg.value
                    ? "ring-accent"
                    : "ring-transparent hover:ring-line",
                )}
              >
                {bg.value ? (
                  <img
                    src={publicAssetUrl(bg.value)}
                    alt={uiText(bg.name)}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="grid h-full place-items-center text-[11px] font-medium text-ink-soft">
                    {uiText(bg.name)}
                  </span>
                )}
              </button>
            </Tooltip>
          ))}

          {BACKGROUND_COLORS.map((c) => (
            <Tooltip key={c.value} label={uiText(c.name)}>
              <button
                type="button"
                aria-label={uiText(`Nền ${c.name}`)}
                onClick={() => onUpdate({ background: c.value })}
                style={{ backgroundColor: c.value }}
                className={cn(
                  "aspect-video rounded-[var(--radius-inner)] ring-2 transition",
                  settings.background === c.value
                    ? "ring-accent"
                    : "ring-transparent hover:ring-line",
                )}
              />
            </Tooltip>
          ))}

          {/* Custom colour — labelled tile so it never blends with a preset. */}
          <CustomColorControl
            value={
              isColorBackground(settings.background)
                ? settings.background
                : "#6b5566"
            }
            active={customBg}
            onChange={(v) => onUpdate({ background: clampBackgroundColor(v) })}
            onPreview={onPreview}
            className="aspect-video rounded-[var(--radius-inner)]"
          />
        </div>
      </div>
    </>
  );
}
/** A round preset swatch; shows a check when it is the active colour. */
function ColorSwatch({
  color,
  selected,
  ariaLabel,
  onClick,
}: {
  color: string;
  selected: boolean;
  ariaLabel: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      onClick={onClick}
      style={{ backgroundColor: color }}
      className={cn(
        "grid h-9 w-9 place-items-center rounded-full text-white transition-transform hover:scale-105",
        selected &&
          "ring-2 ring-accent ring-offset-2 ring-offset-[var(--color-surface)]",
      )}
    >
      {selected ? <Check size={16} /> : null}
    </button>
  );
}
/**
 * A native colour input behind a labelled "Tuỳ chỉnh" surface. Shows a rainbow
 * until a custom colour is active, then fills with the chosen colour. `className`
 * sets the shape (round pill for the accent row, tile for the background grid).
 */
function CustomColorControl({
  value,
  active,
  onChange,
  onPreview,
  className,
}: {
  value: string;
  active: boolean;
  onChange: (value: string) => void;
  onPreview?: (active: boolean) => void;
  className?: string;
}) {
  return (
    <ColorPickerPopover
      value={value}
      onChange={onChange}
      onOpenChange={onPreview}
    >
      <button
        type="button"
        aria-label={uiText("Màu tuỳ chỉnh")}
        style={active ? { backgroundColor: value } : { background: RAINBOW }}
        className={cn(
          "relative grid cursor-pointer place-items-center text-[11px] font-semibold text-white ring-2 transition [text-shadow:0_1px_2px_rgba(0,0,0,0.55)]",
          active ? "ring-accent" : "ring-transparent hover:ring-line",
          className,
        )}
      >
        {uiText("Tuỳ chỉnh")}
      </button>
    </ColorPickerPopover>
  );
}
