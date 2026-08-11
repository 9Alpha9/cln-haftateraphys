import { cn } from "@/lib/utils";
import { type ReactNode } from "react";

interface ContainerProps {
  children: ReactNode;
  className?: string;
  as?: "div" | "section" | "article" | "main";
}

export function Container({
  children,
  className,
  as: Component = "div",
}: ContainerProps) {
  return (
    <Component className={cn("container-hafta", className)}>
      {children}
    </Component>
  );
}
