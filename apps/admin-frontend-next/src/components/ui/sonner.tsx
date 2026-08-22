import { Toaster as Sonner, type ToasterProps } from "sonner";
import { cn } from "@/lib/utils";

function Toaster({ className, ...props }: ToasterProps) {
  return <Sonner theme="light" className={cn("toaster group", className)} {...props} />;
}

export { Toaster };
