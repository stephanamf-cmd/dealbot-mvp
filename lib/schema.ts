export const inputSchema = {
  name: "collect_deal_inputs",
  description: "Extracts commercial real estate deal inputs from user messages.",
  parameters: {
    type: "object",
    additionalProperties: false,
    properties: {
      purchasePrice: { type: "number", description: "Total purchase price in USD." },
      noiAnnual: { type: "number", description: "Annual NOI in USD." },
      marketType: {
        type: "string",
        enum: ["primary", "secondary", "tertiary"],
        description: "Market classification."
      }
    },
    required: ["purchasePrice", "noiAnnual", "marketType"]
  }
} as const;
