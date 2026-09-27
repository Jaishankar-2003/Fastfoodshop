// import { formatINR } from "@/lib/format";
// import type { Product } from "@/types/database";

// type Props = {
//   product: Product;
//   quantity: number;
//   onAdd: () => void;
//   onIncrease: () => void;
//   onDecrease: () => void;
// };

// export function ProductCard({ product, quantity, onAdd, onIncrease, onDecrease }: Props) {
//   const unavailable = !product.is_available;

//   return (
//     <article className="flex gap-3 rounded-2xl bg-card p-3 ring-1 ring-line">
//       <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-orange-50">
//         {product.image_url ? (
//           // eslint-disable-next-line @next/next/no-img-element
//           <img src={product.image_url} alt={product.name} className="h-full w-full object-cover" />
//         ) : (
//           <div className="flex h-full w-full items-center justify-center text-2xl">🥟</div>
//         )}
//         {unavailable ? (
//           <div className="absolute inset-0 flex items-center justify-center bg-black/45 text-[11px] font-bold uppercase tracking-wide text-white">
//             Unavailable
//           </div>
//         ) : null}
//       </div>
//       <div className="min-w-0 flex-1">
//         <div className="flex items-start justify-between gap-2">
//           <h3 className="text-[15px] font-semibold leading-snug">{product.name}</h3>
//           {product.is_featured ? (
//             <span className="rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-bold uppercase text-brand">
//               Popular
//             </span>
//           ) : null}
//         </div>
//         {product.description ? (
//           <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted">{product.description}</p>
//         ) : null}
//         <div className="mt-2 flex items-center justify-between gap-2">
//           <p className="text-base font-bold">{formatINR(product.price_paise)}</p>
//           {unavailable ? (
//             <span className="text-xs font-semibold uppercase text-muted">Unavailable</span>
//           ) : quantity > 0 ? (
//             <div className="flex items-center gap-2">
//               <button
//                 type="button"
//                 onClick={onDecrease}
//                 className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100 text-lg font-bold text-brand"
//                 aria-label="Decrease quantity"
//               >
//                 −
//               </button>
//               <span className="w-5 text-center text-sm font-bold">{quantity}</span>
//               <button
//                 type="button"
//                 onClick={onIncrease}
//                 className="flex h-10 w-10 items-center justify-center rounded-full bg-brand text-lg font-bold text-white"
//                 aria-label="Increase quantity"
//               >
//                 +
//               </button>
//             </div>
//           ) : (
//             <button
//               type="button"
//               onClick={onAdd}
//               className="h-10 rounded-full bg-brand px-4 text-sm font-bold text-white"
//             >
//               Add
//             </button>
//           )}
//         </div>
//       </div>
//     </article>
//   );
// }




import { formatINR } from "@/lib/format";
import type { Product } from "@/types/database";

type Props = {
  product: Product;
  quantity: number;
  disabled?: boolean;
  onAdd: () => void;
  onIncrease: () => void;
  onDecrease: () => void;
};

export function ProductCard({
  product,
  quantity,
  disabled = false,
  onAdd,
  onIncrease,
  onDecrease,
}: Props) {
  const unavailable = !product.is_available || disabled;

  return (
    <article
      className={`overflow-hidden rounded-[22px] bg-white shadow-[0_3px_18px_rgba(35,20,10,0.055)] ring-1 ring-black/5 ${unavailable ? "opacity-60" : ""
        }`}
    >
      <div className="flex min-h-[145px] gap-3 p-3">
        {/* FOOD IMAGE */}
        <div className="relative h-[128px] w-[128px] shrink-0 overflow-hidden rounded-[18px] bg-orange-50">
          {product.image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={product.image_url}
              alt={product.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-4xl">
              🥟
            </div>
          )}

          {product.is_featured && !unavailable ? (
            <span className="absolute left-2.5 top-2.5 rounded-full bg-white/95 px-2 py-1 text-[9px] font-extrabold uppercase tracking-wide text-[#E85D04] shadow-sm">
              Popular
            </span>
          ) : null}

          {!product.is_available ? (
            <div className="absolute inset-0 flex items-center justify-center bg-black/45">
              <span className="rounded-full bg-black/70 px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-wide text-white">
                Sold out
              </span>
            </div>
          ) : null}
        </div>

        {/* CONTENT */}
        <div className="flex min-w-0 flex-1 flex-col py-0.5">
          <div>
            <h3 className="line-clamp-2 text-[16px] font-extrabold leading-[1.2] text-[#17130F]">
              {product.name}
            </h3>

            {product.description ? (
              <p className="mt-1.5 line-clamp-2 text-[12px] leading-[1.45] text-[#786F67]">
                {product.description}
              </p>
            ) : null}
          </div>

          <div className="mt-auto flex items-end justify-between gap-2 pt-3">
            <p className="text-[17px] font-extrabold text-[#17130F]">
              {formatINR(product.price_paise)}
            </p>

            {!product.is_available ? (
              <span className="pb-1 text-[10px] font-bold uppercase tracking-wide text-[#9A9189]">
                Unavailable
              </span>
            ) : quantity > 0 ? (
              <div className="flex h-10 items-center overflow-hidden rounded-full bg-[#FFF0E5]">
                <button
                  type="button"
                  onClick={onDecrease}
                  disabled={disabled}
                  className="flex h-10 w-10 items-center justify-center text-lg font-bold text-[#E85D04] active:bg-orange-100 disabled:opacity-50"
                  aria-label={`Decrease ${product.name}`}
                >
                  −
                </button>

                <span className="w-7 text-center text-sm font-extrabold text-[#17130F]">
                  {quantity}
                </span>

                <button
                  type="button"
                  onClick={onIncrease}
                  disabled={disabled}
                  className="flex h-10 w-10 items-center justify-center bg-[#E85D04] text-lg font-bold text-white active:bg-[#D65303] disabled:opacity-50"
                  aria-label={`Increase ${product.name}`}
                >
                  +
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={onAdd}
                disabled={disabled}
                className="flex h-10 min-w-[70px] items-center justify-center rounded-full bg-[#E85D04] px-4 text-sm font-extrabold text-white shadow-sm active:scale-95 active:bg-[#D65303] disabled:cursor-not-allowed disabled:bg-[#C9C1B9]"
              >
                Add
              </button>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}