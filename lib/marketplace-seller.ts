/**
 * Populated seller can be null if the User document was deleted but Item still references it.
 */
export function toMarketplaceSellerPayload(seller: unknown): {
  name: string;
  telegram?: string;
  phoneNumber?: string;
} {
  if (seller && typeof seller === "object" && seller !== null && "name" in seller) {
    const s = seller as {
      name?: string;
      telegram?: string;
      phoneNumber?: string;
    };
    return {
      name: typeof s.name === "string" && s.name.length > 0 ? s.name : "Unknown seller",
      telegram: s.telegram,
      phoneNumber: s.phoneNumber,
    };
  }
  return { name: "Unknown seller" };
}
