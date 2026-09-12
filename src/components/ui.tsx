import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import type { ReactNode, ButtonHTMLAttributes } from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
export function cn(...inputs: Parameters<typeof clsx>) {
  return twMerge(clsx(...inputs));
}
export function Button({
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button className={cn("btn", className)} {...props} />;
}
export function Badge({ value }: { value: string }) {
  return (
    <span
      className={
        "badge " +
        (value === "Completed" || value === "Paid" || value === "Active"
          ? "green"
          : value === "At Risk" || value === "High" || value === "Revision"
            ? "red"
            : "blue")
      }
    >
      {value}
    </span>
  );
}
export function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  return (
    <Dialog.Root open onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="overlay" />
        <Dialog.Content className="modal">
          <div className="flex between">
            <Dialog.Title>{title}</Dialog.Title>
            <Dialog.Close className="icon-btn" aria-label="Close">
              <X size={20} />
            </Dialog.Close>
          </div>
          <Dialog.Description className="muted">
            Keep your agency's work organized and connected.
          </Dialog.Description>
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
export function Avatar({ name }: { name: string }) {
  return (
    <span className="avatar">
      {name
        .split(" ")
        .map((x) => x[0])
        .slice(0, 2)
        .join("")}
    </span>
  );
}
export function Empty() {
  return (
    <div className="empty">
      <span>✦</span>
      <h3>A fresh start</h3>
      <p>No matching records. Adjust filters or create your first item.</p>
    </div>
  );
}
