// "use client";

// import { useEffect, useMemo, useRef, useState } from "react";
// import { createClient } from "@/lib/supabase/client";
// import { formatINR } from "@/lib/format";
// import { isVisibleToAdminKitchen, statusActionLabel } from "@/lib/orders";
// import { advanceOrderAction, cancelOrderAction, markCashReceivedAction, clearOrderHistoryAction } from "@/app/admin/actions";
// import type { Order, OrderItem, OrderWithItems } from "@/types/database";

// type Props = {
//   shopId: string;
//   initialOrders: OrderWithItems[];
// };

// export function OrdersBoard({ shopId, initialOrders }: Props) {
//   const [orders, setOrders] = useState(initialOrders);
//   const [banner, setBanner] = useState<string | null>(null);
//   const [clearingHistory, setClearingHistory] = useState(false);
//   const knownIds = useRef(new Set(initialOrders.map((order) => order.id)));

//   useEffect(() => {
//     setOrders(initialOrders);
//     knownIds.current = new Set(initialOrders.map((order) => order.id));
//   }, [initialOrders]);

//   useEffect(() => {
//     const supabase = createClient();
//     const channel = supabase
//       .channel(`admin-orders-${shopId}`)
//       .on(
//         "postgres_changes",
//         { event: "*", schema: "public", table: "orders", filter: `shop_id=eq.${shopId}` },
//         async (payload) => {
//           const row = (payload.new ?? payload.old) as Order | undefined;
//           if (!row?.id) return;
//           const response = await fetch(`/api/orders/${row.id}`);
//           if (!response.ok) return;
//           const body = await response.json();
//           const incoming = body.order as OrderWithItems;
//           setOrders((current) => {
//             const without = current.filter((order) => order.id !== incoming.id);
//             return [incoming, ...without].sort(
//               (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
//             );
//           });
//           const previous = payload.old as Order | undefined;
//           const isNewKitchenOrder =
//             isVisibleToAdminKitchen(incoming) &&
//             (payload.eventType === "INSERT" ||
//               (payload.eventType === "UPDATE" &&
//                 incoming.payment_method === "ONLINE" &&
//                 incoming.payment_status === "PAID" &&
//                 previous?.payment_status !== "PAID"));
//           if (isNewKitchenOrder && !knownIds.current.has(incoming.id)) {
//             knownIds.current.add(incoming.id);
//             setBanner(`New order #${incoming.order_number}`);
//             ping();
//           } else {
//             knownIds.current.add(incoming.id);
//           }
//         },
//       )
//       .subscribe();

//     return () => {
//       void supabase.removeChannel(channel);
//     };
//   }, [shopId]);

//   const active = useMemo(
//     () => orders.filter(isVisibleToAdminKitchen),
//     [orders],
//   );
//   const history = useMemo(
//     () =>
//       orders.filter(
//         (order) =>
//           order.order_status === "COMPLETED" ||
//           order.order_status === "CANCELLED" ||
//           (order.payment_method === "ONLINE" && order.payment_status !== "PAID"),
//       ),
//     [orders],
//   );

//   return (
//     <div>
//       {banner ? (
//         <div className="mb-4 rounded-2xl bg-brand px-4 py-3 font-bold text-white">🔔 {banner}</div>
//       ) : null}

//       <h2 className="text-sm font-bold uppercase tracking-wide text-muted">New / active orders</h2>
//       <div className="mt-3 space-y-4">
//         {active.length === 0 ? (
//           <p className="rounded-2xl bg-card px-4 py-8 text-center text-sm text-muted ring-1 ring-line">
//             No active orders
//           </p>
//         ) : (
//           active.map((order) => <OrderCard key={order.id} order={order} />)
//         )}
//       </div>

//       {/* <h2 className="mt-10 text-sm font-bold uppercase tracking-wide text-muted">History</h2>
//       <div className="mt-3 space-y-4">
//         {history.slice(0, 30).map((order) => (
//           <OrderCard key={order.id} order={order} compact />
//         ))}
//       </div> */}
//       <div className="mt-10 flex items-center justify-between gap-3">
//         <h2 className="text-sm font-bold uppercase tracking-wide text-muted">
//           History
//         </h2>

//         {history.length > 0 ? (
//           <button
//             type="button"
//             disabled={clearingHistory}
//             onClick={async () => {
//               const confirmed = window.confirm(
//                 "Clear all order history? This will permanently delete completed, cancelled, and failed/unpaid historical orders."
//               );

//               if (!confirmed) return;

//               setClearingHistory(true);
//               setBanner(null);

//               const result = await clearOrderHistoryAction();

//               if (result.error) {
//                 setBanner(`❌ ${result.error}`);
//               } else {
//                 setOrders((current) =>
//                   current.filter((order) => !history.some((item) => item.id === order.id))
//                 );

//                 setBanner(
//                   result.deleted
//                     ? `Cleared ${result.deleted} historical order${result.deleted === 1 ? "" : "s"}.`
//                     : "No order history to clear."
//                 );
//               }

//               setClearingHistory(false);
//             }}
//             className="rounded-xl px-3 py-2 text-xs font-bold text-red-700 ring-1 ring-red-200 disabled:opacity-50"
//           >
//             {clearingHistory ? "Clearing..." : "Clear history"}
//           </button>
//         ) : null}
//       </div>

//       <div className="mt-3 space-y-4">
//         {history.length === 0 ? (
//           <p className="rounded-2xl bg-card px-4 py-8 text-center text-sm text-muted ring-1 ring-line">
//             No order history
//           </p>
//         ) : (
//           history.slice(0, 30).map((order) => (
//             <OrderCard key={order.id} order={order} compact />
//           ))
//         )}
//       </div>
//     </div>
//   );
// }

// function OrderCard({ order, compact }: { order: OrderWithItems; compact?: boolean }) {
//   const [busy, setBusy] = useState(false);
//   const action = statusActionLabel(order.order_status);
//   const cashPending = order.payment_method === "CASH" && order.payment_status !== "PAID";

//   return (
//     <article className="rounded-3xl bg-card p-4 ring-1 ring-line">
//       <div className="flex items-start justify-between gap-3">
//         <div>
//           <p className="text-xl font-bold">#{order.order_number}</p>
//           <p className="mt-1 text-sm">
//             Customer: <span className="font-semibold">{order.customer_name}</span>
//           </p>
//           <p className="text-sm">
//             Mobile: <span className="font-semibold">{order.customer_mobile}</span>
//           </p>
//         </div>
//         <StatusPill status={order.order_status} />
//       </div>
//       <ul className="mt-3 text-sm">
//         {(order.order_items ?? []).map((item: OrderItem) => (
//           <li key={item.id}>
//             {item.quantity} × {item.product_name}
//           </li>
//         ))}
//       </ul>
//       <p className="mt-3 text-lg font-bold">Total {formatINR(order.total_paise)}</p>
//       <p className="mt-1 text-sm font-semibold">
//         {order.payment_method === "CASH" ? "Cash" : "Online"} —{" "}
//         {order.payment_status === "PAID" ? "Paid" : order.payment_status === "FAILED" ? "Failed" : "Payment pending"}
//       </p>
//       {!compact ? (
//         <div className="mt-4 flex flex-col gap-2">
//           {action ? (
//             <button
//               type="button"
//               disabled={busy}
//               onClick={async () => {
//                 setBusy(true);
//                 await advanceOrderAction(order.id);
//                 setBusy(false);
//               }}
//               className="h-12 rounded-2xl bg-brand font-bold text-white disabled:opacity-60"
//             >
//               {action}
//             </button>
//           ) : null}
//           {cashPending ? (
//             <button
//               type="button"
//               disabled={busy}
//               onClick={async () => {
//                 setBusy(true);
//                 await markCashReceivedAction(order.id);
//                 setBusy(false);
//               }}
//               className="h-12 rounded-2xl bg-emerald-700 font-bold text-white disabled:opacity-60"
//             >
//               Mark payment received
//             </button>
//           ) : null}
//           {order.order_status !== "COMPLETED" && order.order_status !== "CANCELLED" ? (
//             <button
//               type="button"
//               disabled={busy}
//               onClick={async () => {
//                 setBusy(true);
//                 await cancelOrderAction(order.id);
//                 setBusy(false);
//               }}
//               className="h-11 text-sm font-semibold text-red-700"
//             >
//               Cancel order
//             </button>
//           ) : null}
//         </div>
//       ) : null}
//     </article>
//   );
// }

// function StatusPill({ status }: { status: string }) {
//   const map: Record<string, string> = {
//     NEW: "bg-red-100 text-red-700",
//     PREPARING: "bg-amber-100 text-amber-800",
//     READY: "bg-emerald-100 text-emerald-800",
//     COMPLETED: "bg-stone-200 text-stone-700",
//     CANCELLED: "bg-stone-100 text-stone-500",
//   };
//   return (
//     <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase ${map[status] ?? "bg-stone-100"}`}>
//       {status}
//     </span>
//   );
// }

// function ping() {
//   try {
//     const ctx = new AudioContext();
//     const osc = ctx.createOscillator();
//     const gain = ctx.createGain();
//     osc.frequency.value = 880;
//     gain.gain.value = 0.04;
//     osc.connect(gain);
//     gain.connect(ctx.destination);
//     osc.start();
//     osc.stop(ctx.currentTime + 0.18);
//   } catch {
//     // ignore autoplay limits
//   }
// }


"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatINR } from "@/lib/format";
import { isVisibleToAdminKitchen, statusActionLabel } from "@/lib/orders";
import {
  advanceOrderAction,
  cancelOrderAction,
  markCashReceivedAction,
  clearOrderHistoryAction,
} from "@/app/admin/actions";
import type { Order, OrderItem, OrderWithItems } from "@/types/database";

type Props = {
  shopId: string;
  initialOrders: OrderWithItems[];
};

export function OrdersBoard({ shopId, initialOrders }: Props) {
  const [orders, setOrders] = useState<OrderWithItems[]>(initialOrders);
  const [banner, setBanner] = useState<string | null>(null);
  const [clearingHistory, setClearingHistory] = useState(false);

  const knownIds = useRef(
    new Set(initialOrders.map((order) => order.id)),
  );

  useEffect(() => {
    setOrders(initialOrders);

    knownIds.current = new Set(
      initialOrders.map((order) => order.id),
    );
  }, [initialOrders]);

  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel(`admin-orders-${shopId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
          filter: `shop_id=eq.${shopId}`,
        },
        async (payload) => {
          const row = (payload.new ?? payload.old) as
            | Order
            | undefined;

          if (!row?.id) return;

          /*
           * Handle deleted orders separately.
           *
           * When clear history deletes an order, the API endpoint
           * will no longer find that order. So we remove it directly
           * from the local state.
           */
          if (payload.eventType === "DELETE") {
            setOrders((current) =>
              current.filter((order) => order.id !== row.id),
            );

            knownIds.current.delete(row.id);

            return;
          }

          /*
           * INSERT / UPDATE
           *
           * Get the complete order including order_items.
           */
          const response = await fetch(`/api/orders/${row.id}`);

          if (!response.ok) {
            return;
          }

          const body = await response.json();

          const incoming = body.order as OrderWithItems;

          setOrders((current) => {
            const withoutCurrent = current.filter(
              (order) => order.id !== incoming.id,
            );

            return [incoming, ...withoutCurrent].sort(
              (a, b) =>
                new Date(b.created_at).getTime() -
                new Date(a.created_at).getTime(),
            );
          });

          /*
           * Notify admin when a new kitchen-visible order arrives.
           */
          const previous = payload.old as Order | undefined;

          const isNewKitchenOrder =
            isVisibleToAdminKitchen(incoming) &&
            (payload.eventType === "INSERT" ||
              (payload.eventType === "UPDATE" &&
                incoming.payment_method === "ONLINE" &&
                incoming.payment_status === "PAID" &&
                previous?.payment_status !== "PAID"));

          if (
            isNewKitchenOrder &&
            !knownIds.current.has(incoming.id)
          ) {
            knownIds.current.add(incoming.id);

            setBanner(
              `New order #${incoming.order_number}`,
            );

            ping();
          } else {
            knownIds.current.add(incoming.id);
          }
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [shopId]);

  /*
   * Active orders:
   *
   * NEW
   * PREPARING
   * READY
   *
   * based on isVisibleToAdminKitchen().
   */
  const active = useMemo(
    () => orders.filter(isVisibleToAdminKitchen),
    [orders],
  );

  /*
   * Historical orders:
   *
   * COMPLETED
   * CANCELLED
   * ONLINE payment that is not PAID
   */
  const history = useMemo(
    () =>
      orders.filter(
        (order) =>
          order.order_status === "COMPLETED" ||
          order.order_status === "CANCELLED" ||
          (order.payment_method === "ONLINE" &&
            order.payment_status !== "PAID"),
      ),
    [orders],
  );

  async function handleClearHistory() {
    const confirmed = window.confirm(
      "Clear all order history?\n\n" +
      "This will permanently delete completed, cancelled, " +
      "and failed/unpaid historical orders.\n\n" +
      "Active orders and menu items will not be deleted.\n\n" +
      "This action cannot be undone.",
    );

    if (!confirmed) {
      return;
    }

    setClearingHistory(true);
    setBanner(null);

    try {
      const result = await clearOrderHistoryAction();

      if (result.error) {
        setBanner(`❌ ${result.error}`);
        return;
      }

      /*
       * Remove the same historical orders from the current UI
       * immediately after successful deletion.
       */
      setOrders((current) =>
        current.filter(
          (order) =>
            !history.some(
              (historyOrder) =>
                historyOrder.id === order.id,
            ),
        ),
      );

      /*
       * Remove deleted IDs from realtime tracking.
       */
      history.forEach((order) => {
        knownIds.current.delete(order.id);
      });

      if (result.deleted && result.deleted > 0) {
        setBanner(
          `Cleared ${result.deleted} historical order${result.deleted === 1 ? "" : "s"
          }.`,
        );
      } else {
        setBanner("No order history to clear.");
      }
    } catch (error) {
      console.error("Clear history error:", error);

      setBanner(
        "❌ Something went wrong while clearing order history.",
      );
    } finally {
      setClearingHistory(false);
    }
  }

  return (
    <div>
      {/* Notification banner */}
      {banner ? (
        <div className="mb-4 rounded-2xl bg-brand px-4 py-3 font-bold text-white">
          {banner}
        </div>
      ) : null}

      {/* ========================= */}
      {/* ACTIVE ORDERS */}
      {/* ========================= */}

      <h2 className="text-sm font-bold uppercase tracking-wide text-muted">
        New / active orders
      </h2>

      <div className="mt-3 space-y-4">
        {active.length === 0 ? (
          <p className="rounded-2xl bg-card px-4 py-8 text-center text-sm text-muted ring-1 ring-line">
            No active orders
          </p>
        ) : (
          active.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
            />
          ))
        )}
      </div>

      {/* ========================= */}
      {/* ORDER HISTORY */}
      {/* ========================= */}

      <div className="mt-10 flex items-center justify-between gap-3">
        <h2 className="text-sm font-bold uppercase tracking-wide text-muted">
          History
        </h2>

        {history.length > 0 ? (
          <button
            type="button"
            disabled={clearingHistory}
            onClick={handleClearHistory}
            className="rounded-xl px-3 py-2 text-xs font-bold text-red-700 ring-1 ring-red-200 disabled:opacity-50"
          >
            {clearingHistory
              ? "Clearing..."
              : "Clear history"}
          </button>
        ) : null}
      </div>

      <div className="mt-3 space-y-4">
        {history.length === 0 ? (
          <p className="rounded-2xl bg-card px-4 py-8 text-center text-sm text-muted ring-1 ring-line">
            No order history
          </p>
        ) : (
          history.slice(0, 30).map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              compact
            />
          ))
        )}
      </div>
    </div>
  );
}

/* ========================================================= */
/* ORDER CARD */
/* ========================================================= */

function OrderCard({
  order,
  compact,
}: {
  order: OrderWithItems;
  compact?: boolean;
}) {
  const [busy, setBusy] = useState(false);

  const action = statusActionLabel(
    order.order_status,
  );

  const cashPending =
    order.payment_method === "CASH" &&
    order.payment_status !== "PAID";

  return (
    <article className="rounded-3xl bg-card p-4 ring-1 ring-line">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xl font-bold">
            #{order.order_number}
          </p>

          <p className="mt-1 text-sm">
            Customer:{" "}
            <span className="font-semibold">
              {order.customer_name}
            </span>
          </p>

          <p className="text-sm">
            Mobile:{" "}
            <span className="font-semibold">
              {order.customer_mobile}
            </span>
          </p>
        </div>

        <StatusPill
          status={order.order_status}
        />
      </div>

      {/* Items */}
      <ul className="mt-3 text-sm">
        {(order.order_items ?? []).map(
          (item: OrderItem) => (
            <li key={item.id}>
              {item.quantity} × {item.product_name}
            </li>
          ),
        )}
      </ul>

      {/* Total */}
      <p className="mt-3 text-lg font-bold">
        Total {formatINR(order.total_paise)}
      </p>

      {/* Payment */}
      <p className="mt-1 text-sm font-semibold">
        {order.payment_method === "CASH"
          ? "Cash"
          : "Online"}{" "}
        —{" "}
        {order.payment_status === "PAID"
          ? "Paid"
          : order.payment_status === "FAILED"
            ? "Failed"
            : "Payment pending"}
      </p>

      {/* Active order actions */}
      {!compact ? (
        <div className="mt-4 flex flex-col gap-2">
          {action ? (
            <button
              type="button"
              disabled={busy}
              onClick={async () => {
                setBusy(true);

                try {
                  await advanceOrderAction(
                    order.id,
                  );
                } finally {
                  setBusy(false);
                }
              }}
              className="h-12 rounded-2xl bg-brand font-bold text-white disabled:opacity-60"
            >
              {action}
            </button>
          ) : null}

          {cashPending ? (
            <button
              type="button"
              disabled={busy}
              onClick={async () => {
                setBusy(true);

                try {
                  await markCashReceivedAction(
                    order.id,
                  );
                } finally {
                  setBusy(false);
                }
              }}
              className="h-12 rounded-2xl bg-emerald-700 font-bold text-white disabled:opacity-60"
            >
              Mark payment received
            </button>
          ) : null}

          {order.order_status !== "COMPLETED" &&
            order.order_status !== "CANCELLED" ? (
            <button
              type="button"
              disabled={busy}
              onClick={async () => {
                setBusy(true);

                try {
                  await cancelOrderAction(
                    order.id,
                  );
                } finally {
                  setBusy(false);
                }
              }}
              className="h-11 text-sm font-semibold text-red-700"
            >
              Cancel order
            </button>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}

/* ========================================================= */
/* STATUS PILL */
/* ========================================================= */

function StatusPill({
  status,
}: {
  status: string;
}) {
  const map: Record<string, string> = {
    NEW: "bg-red-100 text-red-700",
    PREPARING:
      "bg-amber-100 text-amber-800",
    READY:
      "bg-emerald-100 text-emerald-800",
    COMPLETED:
      "bg-stone-200 text-stone-700",
    CANCELLED:
      "bg-stone-100 text-stone-500",
  };

  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-bold uppercase ${map[status] ?? "bg-stone-100"
        }`}
    >
      {status}
    </span>
  );
}

/* ========================================================= */
/* ORDER SOUND */
/* ========================================================= */

function ping() {
  try {
    const ctx = new AudioContext();

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.frequency.value = 880;
    gain.gain.value = 0.04;

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.18);
  } catch {
    // Ignore autoplay/browser audio restrictions.
  }
}