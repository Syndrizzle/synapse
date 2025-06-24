/* eslint-disable react-refresh/only-export-components */
import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "../lib/utils";

const buttonVariants = cva(
    "inline-flex items-center justify-between gap-2 whitespace-nowrap font-bold font-body transition-all disabled:pointer-events-none disabled:opacity-50 shrink-0 outline-none w-full cursor-pointer duration-500 relative overflow-hidden rounded-none hover:rounded-[50px]",
    {
        variants: {
            variant: {
                default: "bg-yellow-300 hover:bg-yellow-400 text-neutral-900 border-2 border-black",
                destructive: "bg-red-400 text-neutral-900 border-2 border-black hover:bg-red-500",
                outline: "bg-neutral-800 text-yellow-500 border-2 border-yellow-500",
            },
            size: {
                default: "h-9 px-4 py-2 has-[>svg]:px-3",
                sm: "h-8 gap-1.5 px-3 has-[>svg]:px-2.5",
                lg: "h-12 px-6 has-[>svg]:px-4",
                icon: "size-9",
            },
        },
        defaultVariants: {
            variant: "default",
            size: "default",
        },
    }
);

function Button({
    className,
    variant,
    size,
    asChild = false,
    ...props
}: React.ComponentProps<"button"> &
    VariantProps<typeof buttonVariants> & {
        asChild?: boolean;
    }) {
    const Comp = asChild ? Slot : "button";

    return (
        <Comp
            data-slot="button"
            className={cn(buttonVariants({ variant, size, className }))}
            {...props}
        />
    );
}

export { Button, buttonVariants };
