// Pricing engine class (pure calculation)
class PricingEngine {
  constructor(data) {
    this.data = data;
  }

  getEffectiveQty(quantity, tiers) {
    let effectiveQty = 0;
    for (let i = 0; i < tiers.length; i++) {
      const tier = tiers[i];
      const nextFrom = (i + 1 < tiers.length) ? tiers[i + 1].from : Infinity;
      const tierQty = Math.max(0, Math.min(quantity, nextFrom - 1) - tier.from + 1);
      if (tierQty > 0) {
        effectiveQty += tierQty * (1 - tier.discount);
      }
    }
    return effectiveQty;
  }

  getHandlingFee(quantity, fees, enabled) {
    if (!enabled) return 0;
    const row = fees.filter(r => quantity >= r.from).slice(-1)[0];
    return row ? row.fee : 0;
  }

  getDayDiscount(day, dayDiscounts) {
    const anchor = dayDiscounts.filter(d => d.day <= day).sort((a, b) => a.day - b.day).slice(-1)[0];
    return anchor ? anchor.discount : 0;
  }

  getPriceAfterQuantityDiscount(days, baseRate, effectiveQty, dayDiscounts) {
    const dailyBase = baseRate * effectiveQty;
    let total = 0;
    for (let day = 1; day <= days; day++) {
      const discount = this.getDayDiscount(day, dayDiscounts);
      const dayFactor = 1 - discount;
      total += dailyBase * dayFactor;
    }
    return total;
  }

  calculateRental(quantity, days, sku, baseRate) {
    const rules = this.data.pricingRules[sku] || this.data.pricingRules.default;

    const effectiveQty = this.getEffectiveQty(quantity, rules.quantityTiers);
    const handlingFee = this.getHandlingFee(quantity, rules.handlingFees, rules.calculateHandlingFee);
    const discountedPrice = this.getPriceAfterQuantityDiscount(days, baseRate, effectiveQty, rules.dayDiscounts);
    const total = discountedPrice + handlingFee;
    const originalPrice = baseRate * quantity * days;
    const totalDiscount = originalPrice - discountedPrice;
    const discountedDailyRate = Math.round((discountedPrice / days / quantity) * 100) / 100;
    const discountPct = originalPrice > 0 ? (totalDiscount / originalPrice) * 100 : 0;

    return { sku, effectiveQty, handlingFee, discountedPrice, total, originalPrice, totalDiscount, discountPct, discountedDailyRate };
  }
}
