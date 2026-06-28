import { OrderStatus } from "@/types";

const STYLES: Record<OrderStatus, string> = {
  PLACED: "text-rust",
  PREPARING: "text-amber",
  COMPLETED: "text-accent",
};

export function StatusStamp({ status }: { status: OrderStatus }) {
  return <span className={`stamp ${STYLES[status]}`}>{status}</span>;
}
