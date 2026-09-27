import { formatINR } from "@/lib/format";
import type { Product } from "@/types/database";

type Props = {
  product: Product;
  quantity: number;
  onAdd: () => void;
  onIncrease: () => void;
  onDecrease: () => void;
};

export function ProductCard({ product, quantity, onAdd, onIncrease, onDecrease }: Props) {
  const unavailable = !product.is_available;

  return (
    <article className="flex gap-3 rounded-2xl bg-card p-3 ring-1 ring-line">
      <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-orange-50">
        {product.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={product.image_url} alt={product.name} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-2xl">🥟</div>
        )}
        {unavailable ? (
          <div className="absolute inset-0 flex items-center justify-center bg-black/45 text-[11px] font-bold uppercase tracking-wide text-white">
            Unavailable
          </div>
        ) : null}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-[15px] font-semibold leading-snug">{product.name}</h3>
          {product.is_featured ? (
            <span className="rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-bold uppercase text-brand">
              Popular
            </span>
          ) : null}
        </div>
        {product.description ? (
          <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted">{product.description}</p>
        ) : null}
        <div className="mt-2 flex items-center justify-between gap-2">
          <p className="text-base font-bold">{formatINR(product.price_paise)}</p>
          {unavailable ? (
            <span className="text-xs font-semibold uppercase text-muted">Unavailable</span>
          ) : quantity > 0 ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onDecrease}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100 text-lg font-bold text-brand"
                aria-label="Decrease quantity"
              >
                −
              </button>
              <span className="w-5 text-center text-sm font-bold">{quantity}</span>
              <button
                type="button"
                onClick={onIncrease}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-brand text-lg font-bold text-white"
                aria-label="Increase quantity"
              >
                +
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={onAdd}
              className="h-10 rounded-full bg-brand px-4 text-sm font-bold text-white"
            >
              Add
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
