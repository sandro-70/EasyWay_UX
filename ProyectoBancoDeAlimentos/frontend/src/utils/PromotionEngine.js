// src/utils/PromotionEngine.js
export default class PromotionEngine {
  constructor({
    productPromoMap = {},    // { [idProducto]: [idPromo, ...] }
    promosInfo = {},         // { [idPromo]: {id_tipo_promo, valor_porcentaje, valor_fijo, compra_min, activa, fecha_inicio, fecha_termina} }
    volumeRules = {},        // { [idProducto]: [ {minQty, unitPrice, id_regla}, ... ] }
    stackingItemToCart = true,
    stackingCartToCoupon = true,
    taxRate = 0.15,
    shippingFixed = 10,
  } = {}) {
    this.productPromoMap = productPromoMap;
    this.promosInfo = promosInfo;
    this.volumeRules = volumeRules;
    this.stackingItemToCart = stackingItemToCart;
    this.stackingCartToCoupon = stackingCartToCoupon;
    this.taxRate = Number(taxRate) || 0;
    this.shippingFixed = Number(shippingFixed) || 0;
  }

  static _inDateRange(startStr, endStr, today = new Date()) {
    const start = startStr ? new Date(startStr) : null;
    const end = endStr ? new Date(endStr) : null;
    if (start && today < start) return false;
    if (end && today > end) return false;
    return true;
  }

  static _pct(pct, base) {
    const v = Number(pct) || 0;
    return Math.max(0, (Number(base) || 0) * (v / 100));
  }

  static buildBackendPayload() {
    // opcional: si luego quieres pasar al backend qué reglas/promo se usaron
    return { ok: true };
  }

  /** Aplica precio escalonado (si hay) para una línea */
  _applyVolume(line) {
    const rules = this.volumeRules[line.id_producto] || [];
    if (!rules.length) return null;
    const qty = line.qty;
    // regla válida con mayor minQty ≤ qty
    const best = rules
      .filter((r) => Number(r.minQty) > 0 && qty >= Number(r.minQty))
      .sort((a, b) => b.minQty - a.minQty)[0];
    if (!best) return null;
    const unitPrice = Number(best.unitPrice) || 0;
    const sub = unitPrice * qty;
    return {
      unitPrice,
      sub,
      meta: best.id_regla || `≥${best.minQty}c/u ${unitPrice}`,
    };
  }

  /** Devuelve la MEJOR promo por producto (fijo o %) según subtotal del carrito */
  _bestItemPromo(line, cartSubtotal) {
    const promoIds = this.productPromoMap[line.id_producto] || [];
    let best = null;
    for (const pid of promoIds) {
      const info = this.promosInfo[Number(pid)];
      if (!info) continue;
      const active = info.activa === true || info.activa === 1 || info.activa === "true";
      if (!active) continue;
      if (!PromotionEngine._inDateRange(info.fecha_inicio, info.fecha_termina)) continue;

      const compraMin = Number(info.compra_min) || 0;
      if (compraMin > 0 && (cartSubtotal || 0) < compraMin) continue;

      let subPromo = 0;
      if (Number(info.id_tipo_promo) === 1 && Number(info.valor_porcentaje) > 0) {
        // %
        const pct = Number(info.valor_porcentaje);
        subPromo = Math.max(0, line.base * (1 - pct / 100));
      } else if (Number(info.id_tipo_promo) === 2 && Number(info.valor_fijo) > 0) {
        // fijo (por unidad)
        const unit = Math.max(0, line.unitBase - Number(info.valor_fijo));
        subPromo = unit * line.qty;
      } else {
        continue;
      }

      if (best == null || subPromo < best.sub) {
        best = { sub: subPromo, idPromo: Number(pid), info };
      }
    }
    return best; // {sub, idPromo, info} o null
  }

  /** Promo de CARRITO: mejor entre las campañas “no por producto” (scope all/todos) */
  _bestCartPromo(subtotalAfterItems) {
    let best = null;
    for (const info of Object.values(this.promosInfo)) {
      const active = info.activa === true || info.activa === 1 || info.activa === "true";
      if (!active) continue;
      if (!PromotionEngine._inDateRange(info.fecha_inicio, info.fecha_termina)) continue;

      // Si la promo está mapeada a productos (aparece en productPromoMap) la consideramos "de producto".
      // Aquí solo aplicamos promos globales (scope === 'todos' o sin lista).
      const isProductScoped = Object.values(this.productPromoMap).some(arr =>
        Array.isArray(arr) && arr.some(x => Number(x) === Number(info.id_promocion))
      );
      if (isProductScoped) continue;

      const compraMin = Number(info.compra_min) || 0;
      if (compraMin > 0 && subtotalAfterItems < compraMin) continue;

      let desc = 0;
      if (Number(info.id_tipo_promo) === 1 && Number(info.valor_porcentaje) > 0) {
        desc = PromotionEngine._pct(info.valor_porcentaje, subtotalAfterItems);
      } else if (Number(info.id_tipo_promo) === 2 && Number(info.valor_fijo) > 0) {
        desc = Math.min(Number(info.valor_fijo), subtotalAfterItems);
      } else {
        continue;
      }

      if (!best || desc > best.desc) {
        best = {
          desc,
          idPromo: Number(info.id_promocion),
        };
      }
    }
    return best; // {desc, idPromo} | null
  }

  /** Cupón sobre el SUBTOTAL DESPUÉS de item+cart promos */
  _couponAmount(coupon, base) {
    if (!coupon) return 0;
    const v = Number(coupon.valor) || 0;
    if (v <= 0) return 0;
    const tipo = String(coupon.tipo || "").toLowerCase();
    if (tipo === "porcentaje") return Math.max(0, base * (v / 100));
    if (tipo === "fijo") return Math.min(v, Math.max(0, base));
    return 0;
  }

  /** Entrada:
   * lines: [{ producto:{id_producto, nombre, precio_base}, cantidad_unidad_medida }]
   * coupon: { codigo, tipo:'porcentaje'|'fijo', valor, termina_en? }
   */
  computeCart(lines = [], coupon = null) {
    // 1) normalizar
    const norm = (lines || []).map((l) => ({
      id_producto: Number(l?.producto?.id_producto),
      nombre: String(l?.producto?.nombre || ""),
      unitBase: Number(l?.producto?.precio_base || 0),
      qty: Number(l?.cantidad_unidad_medida || 0),
    })).filter((x) => Number.isFinite(x.id_producto) && x.qty > 0);

    // 2) subtotal base
    const subtotalBase = norm.reduce((acc, x) => acc + x.unitBase * x.qty, 0);

    // 3) por línea: escalonado vs promo de producto
    const priced = [];
    for (const ln of norm) {
      const base = ln.unitBase * ln.qty;

      // escalonado
      const vol = this._applyVolume(ln);

      // promo por producto (usa subtotal base para compra_min)
      const bestItem = this._bestItemPromo({ ...ln, base }, subtotalBase);

      // decidir mejor (mínimo sub)
      let winner = null;
      if (vol && bestItem) {
        winner = vol.sub <= bestItem.sub
          ? { type: "volume", sub: vol.sub, meta: vol.meta }
          : { type: "promo", sub: bestItem.sub, promoId: bestItem.idPromo };
      } else if (vol) {
        winner = { type: "volume", sub: vol.sub, meta: vol.meta };
      } else if (bestItem) {
        winner = { type: "promo", sub: bestItem.sub, promoId: bestItem.idPromo };
      }

      const subFinal = winner ? winner.sub : base;
      priced.push({
        id_producto: ln.id_producto,
        nombre: ln.nombre,
        qty: ln.qty,
        unitBase: ln.unitBase,
        subBase: base,
        subFinal,
        savings: Math.max(0, base - subFinal),
        volumeRule: winner?.type === "volume" ? winner.meta : null,
        appliedItemPromoId: winner?.type === "promo" ? winner.promoId : null,
      });
    }

    // 4) total después de líneas
    const subtotalAfterItems = priced.reduce((a, x) => a + x.subFinal, 0);

    // 5) promo de carrito (si se permite acumular con promos de producto)
    let cartPromoAmount = 0;
    let appliedCartPromoId = null;
    if (this.stackingItemToCart) {
      const bestCart = this._bestCartPromo(subtotalAfterItems);
      if (bestCart) {
        cartPromoAmount = bestCart.desc;
        appliedCartPromoId = bestCart.idPromo;
      }
    }

    // 6) base para cupón (si se permite)
    const baseForCoupon = Math.max(0, subtotalAfterItems - cartPromoAmount);
    const couponAmount = this.stackingCartToCoupon
      ? this._couponAmount(coupon, baseForCoupon)
      : 0;

    // 7) impuestos y envío
    const taxable = Math.max(0, baseForCoupon - couponAmount);
    const tax = +(taxable * this.taxRate).toFixed(2);
    const shipping = Number(this.shippingFixed) || 0;
    const total = +(taxable + tax + shipping).toFixed(2);

    return {
      lines: priced,
      summary: {
        subtotalBase: +subtotalBase.toFixed(2),
        subtotalAfterItems: +subtotalAfterItems.toFixed(2),
        cartPromo: +cartPromoAmount.toFixed(2),
        appliedCartPromoId,
        coupon: +couponAmount.toFixed(2),
        couponCode: coupon?.codigo || null,
        tax,
        shipping,
        total,
      },
    };
  }
}
