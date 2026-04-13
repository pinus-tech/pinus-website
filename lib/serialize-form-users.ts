/**
 * Populated User refs can be null if the user was deleted; ObjectId-only refs have no name.
 */
export function serializeFormUser(ref: unknown): {
  _id: string;
  name: string;
  email: string;
} {
  if (ref && typeof ref === "object" && ref !== null && "_id" in ref) {
    const o = ref as {
      _id: { toString: () => string };
      name?: string;
      email?: string;
    };
    return {
      _id: o._id.toString(),
      name:
        typeof o.name === "string" && o.name.length > 0 ? o.name : "Deleted user",
      email: typeof o.email === "string" ? o.email : "",
    };
  }
  if (
    ref != null &&
    typeof ref === "object" &&
    "toString" in ref &&
    typeof (ref as { toString: () => string }).toString === "function"
  ) {
    const id = (ref as { toString: () => string }).toString();
    return { _id: id, name: "Unknown", email: "" };
  }
  return { _id: "", name: "Deleted user", email: "" };
}

/** Populated respondent can be null if the user was deleted. */
export function serializeFormRespondent(ref: unknown): {
  _id: string;
  name: string;
  email: string;
  telegram?: string;
  phoneNumber?: string;
} {
  const base = serializeFormUser(ref);
  if (ref && typeof ref === "object" && ref !== null) {
    const o = ref as { telegram?: string; phoneNumber?: string };
    return {
      ...base,
      telegram:
        typeof o.telegram === "string" && o.telegram.trim().length > 0
          ? o.telegram
          : undefined,
      phoneNumber:
        typeof o.phoneNumber === "string" && o.phoneNumber.trim().length > 0
          ? o.phoneNumber
          : undefined,
    };
  }
  return { ...base };
}
