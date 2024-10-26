"use client";

import * as React from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";

import { cn, isNumber } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider } from "./tooltip";
import { TooltipTrigger } from "@radix-ui/react-tooltip";

interface SliderProps
  extends React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root> {
  showTooltip?: boolean;
  interval?: number;
  tooltipFormatter?: (value: number) => string;
}

const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  SliderProps
>(
  (
    {
      className,
      min,
      max,
      step,
      value,
      showTooltip,
      onValueChange,
      onPointerDown,
      onPointerUp,
      ...props
    },
    ref,
  ) => {
    const initialValue: number[] = Array.isArray(value)
      ? value
      : value && isNumber(value)
        ? [value]
        : min && max
          ? [min, max]
          : [0, 100];

    const [showTooltipStates, setShowTooltipStates] = React.useState(
      initialValue.map(() => false),
    );

    const [latestInteractedThumbIndex, setLatestInteractedThumbIndex] =
      React.useState(0);

    const anyShowTooltipState = showTooltipStates.some((state) => state);

    const setShowTooltipStateAtIndex = (index: number, value: boolean) => {
      const newStates = [...showTooltipStates];
      newStates[index] = value;
      setShowTooltipStates(newStates);
    };

    const [localValues, setLocalValues] = React.useState(initialValue);

    const handleValueChange = (newValues: number[]) => {
      setLocalValues(newValues);
      if (onValueChange) {
        onValueChange(newValues);
      }
    };

    React.useEffect(() => {
      setLocalValues(initialValue);
    }, [initialValue]);

    return (
      <SliderPrimitive.Root
        ref={ref}
        className={cn(
          "relative flex w-full touch-none select-none items-center",
          className,
        )}
        min={min}
        max={max}
        step={step}
        value={localValues}
        onValueChange={handleValueChange}
        {...props}
      >
        <SliderPrimitive.Track className="concave bg-foreground/80 relative h-1.5 w-full grow overflow-hidden rounded-full">
          <SliderPrimitive.Range className="convex absolute h-full bg-zinc-600" />
        </SliderPrimitive.Track>

        {localValues.map((localValue, index) => (
          <TooltipProvider key={index}>
            <Tooltip open={showTooltip && anyShowTooltipState}>
              <TooltipTrigger asChild>
                <SliderPrimitive.Thumb
                  className={cn(
                    "convex border-foreground/40 bg-primary-foreground ring-offset-background focus-visible:ring-ring block h-4 w-4 cursor-pointer rounded-full border transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-50",
                    "hover:brightness-150",
                  )}
                  onMouseEnter={() => {
                    setShowTooltipStateAtIndex(index, true);
                    setLatestInteractedThumbIndex(index);
                  }}
                  onTouchStart={() => {
                    setShowTooltipStateAtIndex(index, true);
                    setLatestInteractedThumbIndex(index);
                  }}
                  onMouseLeave={() => {
                    setShowTooltipStateAtIndex(index, false);
                  }}
                  onTouchEnd={() => {
                    setShowTooltipStateAtIndex(index, false);
                  }}
                />
              </TooltipTrigger>
              <TooltipContent
                className={cn(
                  "mb-1 w-auto p-1",
                  index === latestInteractedThumbIndex ? "z-10" : "z-0",
                )}
              >
                <p className="font-medium">
                  {props.tooltipFormatter
                    ? props.tooltipFormatter(localValue)
                    : localValue}
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ))}
      </SliderPrimitive.Root>
    );
  },
);
Slider.displayName = SliderPrimitive.Root.displayName;

export { Slider };
