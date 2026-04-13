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
