import { useEffect, useMemo, useState } from "react";
import { quickOrderPreview, quickOrderPrice } from "../api";
import type { PriceCurrency, QuickOrderPreview, QuickOrderPriceResult, QuickOrderShop } from "../api";
import {
  SHEIN_FRANCE_URL,
  SHOP_LABELS,
  SHOP_LOGOS,
  createId,
  detectShop,
  extractUrl,
  isSheinFranceLink,
  looksLikeCartShare,
  normalizeLink,
} from "../orderItem";
import type { ExtraOption, ItemSnapshot } from "../orderItem";

type OrderItemCardProps = {
  id: string;
  index: number;
  initialLink: string;
  onUpdate: (id: string, snapshot: ItemSnapshot) => void;
  onRemove: (id: string) => void;
  canRemove: boolean;
};

export function OrderItemCard({ id, index, initialLink, onUpdate, onRemove, canRemove }: OrderItemCardProps) {
  const [link, setLink] = useState(initialLink);
  const [isCartShare, setIsCartShare] = useState(false);
  const shop = useMemo(() => detectShop(link), [link]);
  const isBlockedShein = shop === "shein" && !isSheinFranceLink(link);
  const isBlocked = isBlockedShein || isCartShare;

  const [preview, setPreview] = useState<QuickOrderPreview | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [previewNotice, setPreviewNotice] = useState("");

  const [amount, setAmount] = useState("");
  const [shippingAmount, setShippingAmount] = useState("");
  const currencyTotal = Number(amount || 0) + Number(shippingAmount || 0);
  const [currency, setCurrency] = useState<PriceCurrency>("usd");
  const [size, setSize] = useState("");
  const [color, setColor] = useState("");
  const [model, setModel] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [extraOptions, setExtraOptions] = useState<ExtraOption[]>([]);

  const [priceResult, setPriceResult] = useState<QuickOrderPriceResult | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [calcError, setCalcError] = useState("");

  useEffect(() => {
    const trimmed = link.trim();
    const detected = detectShop(trimmed);
    setPreview(null);
    setPreviewNotice("");

    if (!trimmed || !detected) {
      return;
    }

    const timeoutId = setTimeout(() => {
      setIsPreviewLoading(true);
      quickOrderPreview(normalizeLink(trimmed))
        .then((result) => {
          setPreview(result);

          if (result.price) {
            const numeric = parseFloat(result.price.replace(/[^0-9.]/g, ""));

            if (!Number.isNaN(numeric) && numeric > 0) {
              setAmount((current) => current || String(numeric));
            } else {
              setPreviewNotice("Could not read the exact price automatically. Enter it below.");
            }
          } else {
            setPreviewNotice("Could not read the exact price automatically. Enter it below.");
          }
        })
        .catch((error) => {
          console.error("Could not preview product link", error);
          setPreviewNotice("Could not auto-fetch this product. Enter the price manually below.");
        })
        .finally(() => setIsPreviewLoading(false));
    }, 700);

    return () => clearTimeout(timeoutId);
  }, [link]);

  useEffect(() => {
    setPriceResult(null);
    setCalcError("");

    if (!shop || !link.trim() || currencyTotal <= 0 || quantity < 1 || isBlocked) {
      return;
    }

    const timeoutId = setTimeout(() => {
      setIsCalculating(true);
      quickOrderPrice(shop, currencyTotal, quantity, currency)
        .then((result) => setPriceResult(result))
        .catch((error) => {
          console.error("Could not calculate price", error);
          setCalcError(
            error instanceof Error ? error.message : "Could not calculate the price. Please try again.",
          );
        })
        .finally(() => setIsCalculating(false));
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [shop, link, currencyTotal, currency, quantity, isBlocked]);

  const filledExtraOptions = useMemo(
    () => extraOptions.filter((option) => option.label.trim() && option.value.trim()),
    [extraOptions],
  );

  useEffect(() => {
    onUpdate(id, {
      link: link.trim(),
      shop,
      productName: preview?.name || "",
      size,
      color,
      model,
      quantity,
      extraOptions: filledExtraOptions.map((option) => ({
        label: option.label.trim(),
        value: option.value.trim(),
      })),
      priceResult,
    });
    // onUpdate is a stable callback from the parent; omitting it avoids re-running this
    // effect every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, link, shop, preview, size, color, model, quantity, filledExtraOptions, priceResult]);

  const handleAddOption = () => {
    setExtraOptions((current) => [...current, { id: createId("opt"), label: "", value: "" }]);
  };

  const handleRemoveOption = (optionId: string) => {
    setExtraOptions((current) => current.filter((option) => option.id !== optionId));
  };

  const handleOptionChange = (optionId: string, field: "label" | "value", value: string) => {
    setExtraOptions((current) =>
      current.map((option) => (option.id === optionId ? { ...option, [field]: value } : option)),
    );
  };

  return (
    <div className="card qoItemCard">
      <div className="cardTitleRow">
        <div>
          <h3>Product {index + 1}</h3>
          <p className="mutedText">Paste the link, then match the exact options shown on the page.</p>
        </div>
        <div className="qoItemHeaderActions">
          {shop && <span className="platformBadge">{SHOP_LABELS[shop]}</span>}
          {canRemove && (
            <button type="button" className="qoRemoveItemBtn" onClick={() => onRemove(id)}>
              Remove
            </button>
          )}
        </div>
      </div>

      <label>Product link *</label>
      <input
        value={link}
        onChange={(event) => {
          const raw = event.target.value;
          setIsCartShare(looksLikeCartShare(raw));
          setLink(extractUrl(raw));
        }}
        placeholder="Paste your AliExpress, Shein, or Temu product link..."
      />

      {link.trim() && !shop && (
        <div className="noticeBox warning">
          We could not detect the shop from this link. Only AliExpress, Shein, and Temu are
          supported.
        </div>
      )}

      {shop && (
        <div className="qoShopGrid">
          {(Object.keys(SHOP_LABELS) as QuickOrderShop[]).map((shopKey) => (
            <div key={shopKey} className={shopKey === shop ? "qoShopBadge active" : "qoShopBadge"}>
              {SHOP_LOGOS[shopKey] ? (
                <img src={SHOP_LOGOS[shopKey]} alt={`${SHOP_LABELS[shopKey]} logo`} />
              ) : (
                <strong>{SHOP_LABELS[shopKey]}</strong>
              )}
            </div>
          ))}
        </div>
      )}

      {isBlockedShein && (
        <div className="noticeBox warning">
          We only accept Shein orders from Shein France. This link doesn't look like it's from
          Shein France — find the item on Shein France and paste that link instead.
          <a href={SHEIN_FRANCE_URL} target="_blank" rel="noreferrer" className="qoSheinFranceLink">
            Open Shein France
          </a>
        </div>
      )}

      {isCartShare && (
        <div className="noticeBox warning">
          This looks like a shared cart (panier) with multiple items, not a single product — we
          can't price a whole cart as one item. Please paste each product's own link separately:
          remove this link, open your cart, share or copy each item's individual product link,
          and add one per card using "+ Add another product".
        </div>
      )}

      {shop && !isBlocked && (
        <div className="qoPreviewCard">
          {isPreviewLoading ? (
            <p className="mutedText">Checking the product link...</p>
          ) : preview?.supported ? (
            <div className="qoPreviewRow">
              {preview.image_url && <img src={preview.image_url} alt="" className="qoPreviewImage" />}
              <div>
                <strong>{preview.name || `${SHOP_LABELS[shop]} product`}</strong>
                {preview.price && <span className="mutedText">Detected price: {preview.price}</span>}
              </div>
            </div>
          ) : (
            <p className="mutedText">
              Open the link on {SHOP_LABELS[shop]} to check the exact price and options.
            </p>
          )}

          {previewNotice && <div className="noticeBox warning">{previewNotice}</div>}
        </div>
      )}

      {!isBlocked && (
        <>
          <div className="qoOptionsGrid">
            <div>
              <label>Size</label>
              <input
                value={size}
                onChange={(event) => setSize(event.target.value)}
                placeholder="Example: M, EU 40, 8 inch..."
              />
            </div>

            <div>
              <label>Color</label>
              <input
                value={color}
                onChange={(event) => setColor(event.target.value)}
                placeholder="Example: Black, Sky blue..."
              />
            </div>

            <div>
              <label>Model / Variation</label>
              <input
                value={model}
                onChange={(event) => setModel(event.target.value)}
                placeholder="Example: Version A, 128GB, 3 pieces set..."
              />
            </div>

            <div>
              <label>Quantity *</label>
              <input
                type="number"
                min={1}
                value={quantity}
                onChange={(event) => setQuantity(Math.max(1, Number(event.target.value) || 1))}
              />
            </div>
          </div>

          <label>Other options</label>
          {extraOptions.length === 0 && (
            <p className="mutedText">
              Add anything else the product page lets you choose (material, pattern, bundle...).
            </p>
          )}

          {extraOptions.map((option) => (
            <div className="qoExtraOptionRow" key={option.id}>
              <input
                value={option.label}
                onChange={(event) => handleOptionChange(option.id, "label", event.target.value)}
                placeholder="Option name (example: Material)"
              />
              <input
                value={option.value}
                onChange={(event) => handleOptionChange(option.id, "value", event.target.value)}
                placeholder="Your choice (example: Cotton)"
              />
              <button type="button" onClick={() => handleRemoveOption(option.id)}>
                Remove
              </button>
            </div>
          ))}

          <button className="addProductLinkBtn" type="button" onClick={handleAddOption}>
            + Add another option
          </button>

          <label>{shop === "aliexpress" ? "Product price *" : "Item price *"}</label>
          <div className="qoPriceInputRow">
            <input
              type="number"
              min={0.01}
              step={0.01}
              inputMode="decimal"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              placeholder="Example: 12.99"
            />
            <div className="qoCurrencyToggle">
              <button
                type="button"
                className={currency === "usd" ? "active" : ""}
                onClick={() => setCurrency("usd")}
              >
                USD
              </button>
              <button
                type="button"
                className={currency === "eur" ? "active" : ""}
                onClick={() => setCurrency("eur")}
              >
                EUR
              </button>
            </div>
          </div>

          {shop === "aliexpress" && (
            <>
              <label>Shipping price</label>
              <p className="mutedText">
                Enter 0 if shipping is free. Same currency ({currency.toUpperCase()}) as the
                product price above.
              </p>
              <input
                type="number"
                min={0}
                step={0.01}
                inputMode="decimal"
                value={shippingAmount}
                onChange={(event) => setShippingAmount(event.target.value)}
                placeholder="Example: 2.50, or 0 if free"
              />
            </>
          )}

          {isCalculating && <p className="mutedText">Calculating price...</p>}
          {calcError && <div className="noticeBox warning">{calcError}</div>}

          {priceResult && (
            <div className="qoPriceBox">
              {quantity > 1 && (
                <div className="qoPriceRow">
                  <span>Unit price</span>
                  <span>{priceResult.unit_price_tnd} TND</span>
                </div>
              )}
              <div className="qoPriceRow qoPriceTotal">
                <span>Item total</span>
                <span>{priceResult.total_price_tnd} TND</span>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
