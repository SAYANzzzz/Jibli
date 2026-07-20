export type OrderStatus =
  | "new_request"
  | "waiting_confirmation"
  | "price_confirmed"
  | "deposit_paid"
  | "ordered"
  | "preparing"
  | "collected_by_carrier"
  | "at_origin_sorting"
  | "left_origin_sorting"
  | "at_origin_airport"
  | "awaiting_flight"
  | "leaving_origin_country"
  | "arrived_transit_country"
  | "left_transit_country"
  | "arrived_tunisia"
  | "out_for_delivery"
  | "delivered"
  | "cancelled";

export const ORDER_STAGES: { value: OrderStatus; label: string }[] = [
  { value: "new_request", label: "New request" },
  { value: "waiting_confirmation", label: "Waiting confirmation" },
  { value: "price_confirmed", label: "Price confirmed" },
  { value: "deposit_paid", label: "Deposit paid" },
  { value: "ordered", label: "Order placed with supplier" },
  { value: "preparing", label: "Package is being prepared" },
  { value: "collected_by_carrier", label: "Collected by carrier" },
  { value: "at_origin_sorting", label: "Received by sorting center of origin" },
  { value: "left_origin_sorting", label: "Left sorting center of origin" },
  { value: "at_origin_airport", label: "Arrived at the origin airport, awaiting transit" },
  { value: "awaiting_flight", label: "Awaiting flight" },
  { value: "leaving_origin_country", label: "Leaving origin country/region" },
  { value: "arrived_transit_country", label: "Arrived at transit country/region" },
  { value: "left_transit_country", label: "Left transit country/region" },
  { value: "arrived_tunisia", label: "Arrived in Tunisia" },
  { value: "out_for_delivery", label: "Out for delivery" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
];

// Stages an admin manually advances an order through after it has been
// confirmed. "new_request" is excluded since that is only the initial state
// before an admin has taken any action.
export const PROCESS_STAGES = ORDER_STAGES.filter((stage) => stage.value !== "new_request");

export const STATUS_LABELS: Record<string, string> = Object.fromEntries(
  ORDER_STAGES.map((stage) => [stage.value, stage.label]),
);

export function getStatusIndex(status: string): number {
  const index = ORDER_STAGES.findIndex((stage) => stage.value === status);
  return index >= 0 ? index : 0;
}
