"use client"

import * as React from "react"
import { Slider as SliderPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"

interface SliderProps extends React.ComponentProps<typeof SliderPrimitive.Root> {
    buffered?: number
}

function Slider({ className, defaultValue, value, min = 0, max = 100, buffered, ...props }: SliderProps) {
    const _values = React.useMemo(() => (Array.isArray(value) ? value : Array.isArray(defaultValue) ? defaultValue : [min, max]), [value, defaultValue, min, max])

    const bufferedPercent = React.useMemo(() => {
        if (buffered === undefined || max <= min) return 0
        return Math.min(100, Math.max(0, ((buffered - min) / (max - min)) * 100))
    }, [buffered, min, max])

    return (
        <SliderPrimitive.Root
            data-slot="slider"
            defaultValue={defaultValue}
            value={value}
            min={min}
            max={max}
            className={cn(
                "relative flex w-full touch-none items-center select-none data-disabled:opacity-50 data-vertical:h-full data-vertical:min-h-40 data-vertical:w-auto data-vertical:flex-col",
                className
            )}
            {...props}
        >
            <SliderPrimitive.Track
                data-slot="slider-track"
                className="relative grow overflow-hidden rounded-full bg-white/20 data-horizontal:h-1.5 data-horizontal:w-full data-vertical:h-full data-vertical:w-1.5 transition-all group-hover:data-horizontal:h-2.5"
            >
                {/* Buffered / Prefetch indicator layer (like YouTube) */}
                {buffered !== undefined && (
                    <div
                        className="absolute top-0 bottom-0 left-0 bg-white/40 rounded-full pointer-events-none transition-[width] duration-150 ease-out"
                        style={{ width: `${bufferedPercent}%` }}
                    />
                )}
                <SliderPrimitive.Range data-slot="slider-range" className="absolute bg-primary select-none data-horizontal:h-full data-vertical:w-full" />
            </SliderPrimitive.Track>
            {Array.from({ length: _values.length }, (_, index) => (
                <SliderPrimitive.Thumb
                    data-slot="slider-thumb"
                    key={index}
                    className="block size-4 shrink-0 rounded-full border border-primary bg-white shadow-sm ring-ring/50 transition-[color,box-shadow] select-none hover:ring-4 focus-visible:ring-4 focus-visible:outline-hidden disabled:pointer-events-none disabled:opacity-50"
                />
            ))}
        </SliderPrimitive.Root>
    )
}

export { Slider }
