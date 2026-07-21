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
  loadItemDraft,
  looksLikeCartShare,
  normalizeLink,
  saveItemDraft,
} from "../orderItem";
import type { ExtraOption, ItemSnapshot } from "../orderItem";
import { useTranslation } from "../i18n/LanguageContext";

type OrderItemCardProps = {
  id: string;
  index: number;
  initialLink: string;
  onUpdate: (id: string, snapshot: ItemSnapshot) => void;
  onRemove: (id: string) => void;
  canRemove: boolean;
};

export function OrderItemCard({ id, index, initialLink, onUpdate, onRemove, canRemove }: OrderItemCardProps) {
  const { t } = useTranslation();
  // Loaded once per card id: if a mobile browser (or an in-app browser like
  // Instagram's) reloaded the page while the customer was away in another
  // app, this recovers what they'd already filled in instead of starting
  // the card blank again.
  const [draft] = useState(() => loadItemDraft(id));

  // The customer picks the shop explicitly first, instead of it being
  // silently inferred from the pasted link — this makes the flow
  // predictable ("pick a shop, then paste that shop's link") and lets us
  // warn if the link they paste doesn't match what they picked.
  const [shop, setShop] = useState<QuickOrderShop | null>(draft?.shop ?? null);
  const [link, setLink] = useState(draft?.link ?? initialLink);
  const [isCartShare, setIsCartShare] = useState(false);
  const detectedShop = useMemo(() => detectShop(link), [link]);
  const shopMismatch = Boolean(shop && detectedShop && detectedShop !== shop);
  const isBlockedShein = shop === "shein" && link.trim() !== "" && !isSheinFranceLink(link);
  const isBlocked = isBlockedShein || isCartShare;

  const [preview, setPreview] = useState<QuickOrderPreview | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [previewNotice, setPreviewNotice] = useState("");

  const [amount, setAmount] = useState(draft?.amount ?? "");
  const [shippingAmount, setShippingAmount] = useState(draft?.shippingAmount ?? "");
  const currencyTotal = Number(amount || 0) + Number(shippingAmount || 0);
  // USD and EUR are priced identically (see backend pricing.py), so there's
  // no need to make the customer pick one — either currency works.
  const currency: PriceCurrency = "usd";
  const [size, setSize] = useState(draft?.size ?? "");
  const [color, setColor] = useState(draft?.color ?? "");
  const [model, setModel] = useState(draft?.model ?? "");
  const [quantity, setQuantity] = useState(draft?.quantity ?? 1);
  const [extraOptions, setExtraOptions] = useState<ExtraOption[]>(draft?.extraOptions ?? []);

  const [priceResult, setPriceResult] = useState<QuickOrderPriceResult | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [calcError, setCalcError] = useState("");

  useEffect(() => {
    const trimmed = link.trim();
    setPreview(null);
    setPreviewNotice("");

    if (!trimmed || !shop || isBlocked) {
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
              setPreviewNotice(t("orderItem.couldNotReadPrice"));
            }
          } else {
            setPreviewNotice(t("orderItem.couldNotReadPrice"));
          }
        })
        .catch((error) => {
          console.error("Could not preview product link", error);
          setPreviewNotice(t("orderItem.couldNotAutoFetch"));
        })
        .finally(() => setIsPreviewLoading(false));
    }, 700);

    return () => clearTimeout(timeoutId);
  }, [link, shop, isBlocked]);

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
          setCalcError(error instanceof Error ? error.message : t("common.calcErrorFallback"));
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

  useEffect(() => {
    saveItemDraft(id, { link, shop, size, color, model, quantity, amount, shippingAmount, extraOptions });
  }, [id, link, shop, size, color, model, quantity, amount, shippingAmount, extraOptions]);

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
          <h3>{t("orderItem.productN", { n: index + 1 })}</h3>
          <p className="mutedText">
            {shop ? t("orderItem.pasteThenMatch") : t("orderItem.startByChoosing")}
          </p>
        </div>
        <div className="qoItemHeaderActions">
          {shop && <span className="platformBadge">{shop === "shein" ? "Shein France" : SHOP_LABELS[shop]}</span>}
          {canRemove && (
            <button type="button" className="qoRemoveItemBtn" onClick={() => onRemove(id)}>
              {t("orderItem.remove")}
            </button>
          )}
        </div>
      </div>

      <label>{t("orderItem.step1Label")}</label>
      <div className="qoShopPicker">
        {(Object.keys(SHOP_LABELS) as QuickOrderShop[]).map((shopKey) => (
          <button
            type="button"
            key={shopKey}
            className={shopKey === shop ? "qoShopPickerBtn active" : "qoShopPickerBtn"}
            onClick={() => setShop(shopKey)}
          >
            {SHOP_LOGOS[shopKey] && <img src={SHOP_LOGOS[shopKey]} alt="" />}
            <span>{shopKey === "shein" ? "Shein France" : SHOP_LABELS[shopKey]}</span>
          </button>
        ))}
      </div>

      {!shop && <p className="mutedText">{t("orderItem.chooseShopAbove")}</p>}

      {shop && (
        <>
          <label>{t("orderItem.step2Label")}</label>
          <div className="qoLinkInputWrap">
            <input
              value={link}
              onChange={(event) => {
                const raw = event.target.value;
                setIsCartShare(looksLikeCartShare(raw));
                setLink(extractUrl(raw));
              }}
              placeholder={t("orderItem.pastePlaceholder", {
                shop: shop === "shein" ? "Shein France" : SHOP_LABELS[shop],
              })}
            />
            {link && (
              <button
                type="button"
                className="qoLinkClearBtn"
                aria-label={t("orderItem.clearLink")}
                onClick={() => {
                  setLink("");
                  setIsCartShare(false);
                }}
              >
                ×
              </button>
            )}
          </div>

          {shopMismatch && !isBlockedShein && detectedShop && (
            <div className="noticeBox warning">
              {t("orderItem.mismatchWarning", {
                detected: SHOP_LABELS[detectedShop],
                chosen: shop === "shein" ? "Shein France" : SHOP_LABELS[shop],
              })}
            </div>
          )}

          {isBlockedShein && (
            <div className="noticeBox warning">
              {t("orderItem.sheinBlockWarning")}
              <a href={SHEIN_FRANCE_URL} target="_blank" rel="noreferrer" className="qoSheinFranceLink">
                {t("orderItem.openSheinFrance")}
              </a>
            </div>
          )}

          {isCartShare && <div className="noticeBox warning">{t("orderItem.cartShareWarning")}</div>}

          {!isBlocked && link.trim() && (
            <div className="qoPreviewCard">
              {isPreviewLoading ? (
                <p className="mutedText">{t("orderItem.checkingLink")}</p>
              ) : preview?.supported ? (
                <div className="qoPreviewRow">
                  {preview.image_url && <img src={preview.image_url} alt="" className="qoPreviewImage" />}
                  <div>
                    <strong>{preview.name || `${SHOP_LABELS[shop]} product`}</strong>
                    {preview.price && (
                      <span className="mutedText">{t("orderItem.detectedPrice", { price: preview.price })}</span>
                    )}
                  </div>
                </div>
              ) : (
                <p className="mutedText">{t("orderItem.openLinkToCheck", { shop: SHOP_LABELS[shop] })}</p>
              )}

              {previewNotice && <div className="noticeBox warning">{previewNotice}</div>}
            </div>
          )}

          {!isBlocked && (
            <>
              <label>{t("orderItem.step3Label")}</label>
              <div className="qoOptionsGrid">
                <div>
                  <label>{t("orderItem.size")}</label>
                  <input
                    value={size}
                    onChange={(event) => setSize(event.target.value)}
                    placeholder={t("orderItem.sizePlaceholder")}
                  />
                </div>

                <div>
                  <label>{t("orderItem.color")}</label>
                  <input
                    value={color}
                    onChange={(event) => setColor(event.target.value)}
                    placeholder={t("orderItem.colorPlaceholder")}
                  />
                </div>

                <div>
                  <label>{t("orderItem.model")}</label>
                  <input
                    value={model}
                    onChange={(event) => setModel(event.target.value)}
                    placeholder={t("orderItem.modelPlaceholder")}
                  />
                </div>

                <div>
                  <label>{t("orderItem.quantity")}</label>
                  <input
                    type="number"
                    min={1}
                    value={quantity}
                    onChange={(event) => setQuantity(Math.max(1, Number(event.target.value) || 1))}
                  />
                </div>
              </div>

              {extraOptions.length === 0 ? (
                <button className="addProductLinkBtn" type="button" onClick={handleAddOption}>
                  {t("orderItem.addOptionFirst")}
                </button>
              ) : (
                <>
                  {extraOptions.map((option) => (
                    <div className="qoExtraOptionRow" key={option.id}>
                      <input
                        value={option.label}
                        onChange={(event) => handleOptionChange(option.id, "label", event.target.value)}
                        placeholder={t("orderItem.optionNamePlaceholder")}
                      />
                      <input
                        value={option.value}
                        onChange={(event) => handleOptionChange(option.id, "value", event.target.value)}
                        placeholder={t("orderItem.optionValuePlaceholder")}
                      />
                      <button type="button" onClick={() => handleRemoveOption(option.id)}>
                        {t("orderItem.remove")}
                      </button>
                    </div>
                  ))}

                  <button className="addProductLinkBtn" type="button" onClick={handleAddOption}>
                    {t("orderItem.addOption")}
                  </button>
                </>
              )}

              <label>{shop === "aliexpress" ? t("orderItem.productPriceLabel") : t("orderItem.itemPriceLabel")}</label>
              <input
                type="number"
                min={0.01}
                step={0.01}
                inputMode="decimal"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                placeholder={t("orderItem.pricePlaceholder")}
              />

              {shop === "aliexpress" && (
                <>
                  <label>{t("orderItem.shippingPriceLabel")}</label>
                  <p className="mutedText">{t("orderItem.shippingFreeNote")}</p>
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    inputMode="decimal"
                    value={shippingAmount}
                    onChange={(event) => setShippingAmount(event.target.value)}
                    placeholder={t("orderItem.shippingPlaceholder")}
                  />
                </>
              )}

              {isCalculating && <p className="mutedText">{t("orderItem.calculating")}</p>}
              {calcError && <div className="noticeBox warning">{calcError}</div>}

              {priceResult && (
                <div className="qoPriceBox">
                  {quantity > 1 && (
                    <div className="qoPriceRow">
                      <span>{t("orderItem.unitPrice")}</span>
                      <span>{priceResult.unit_price_tnd} TND</span>
                    </div>
                  )}
                  <div className="qoPriceRow qoPriceTotal">
                    <span>{t("orderItem.itemTotal")}</span>
                    <span>{priceResult.total_price_tnd} TND</span>
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
