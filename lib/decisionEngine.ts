export type MarketType = "primary" | "secondary" | "tertiary";

export type DealInputs = {
  purchasePrice: number;
  noiAnnual: number;
  marketType: MarketType;
};

export type DealDecision = {
  dealWorth: number;
  pricingLabel: "UNDERPRICED" | "OVERPRICED" | "FAIR";
  recommendation: "BUY" | "PASS" | "MAKE_AN_OFFER";
  offerPrice?: number;
  debug: {
    capRateUsed: number;
    pricingDeltaPct: number;
  };
};

export function evaluateDeal(inputs: DealInputs, config: any): DealDecision {
  const capRate = config.capRates[inputs.marketType];
  const fairValue = inputs.noiAnnual / capRate;

  const pricingDeltaPct = (inputs.purchasePrice - fairValue) / fairValue;

  const under = config.pricingThresholds.underpricedPct;
  const over = config.pricingThresholds.overpricedPct;

  let pricingLabel: DealDecision["pricingLabel"] = "FAIR";
  if (pricingDeltaPct <= under) pricingLabel = "UNDERPRICED";
  else if (pricingDeltaPct >= over) pricingLabel = "OVERPRICED";

  let recommendation: DealDecision["recommendation"] = "PASS";
  let offerPrice: number | undefined;

  if (pricingLabel === "UNDERPRICED" || pricingLabel === "FAIR") {
    recommendation = "BUY";
  } else {
    const maxForOffer = config.offerRules.maxOverpricedForOfferPct;
    if (pricingDeltaPct <= maxForOffer) {
      recommendation = "MAKE_AN_OFFER";
      offerPrice = Math.round(fairValue * (1 - config.offerRules.offerDiscountPct));
    } else {
      recommendation = "PASS";
    }
  }

  return {
    dealWorth: Math.round(fairValue),
    pricingLabel,
    recommendation,
    ...(offerPrice ? { offerPrice } : {}),
    debug: {
      capRateUsed: capRate,
      pricingDeltaPct: Number(pricingDeltaPct.toFixed(4))
    }
  };
}
