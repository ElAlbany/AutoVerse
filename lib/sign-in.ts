export function safeReturnTo(value: string | undefined) {
  return value &&
    value.startsWith("/") &&
    !value.startsWith("//") &&
    !/^\/sign-(in|up)/.test(value) &&
    !value.includes("\\") &&
    !/[%]2f|[%]5c|[\u0000-\u001f]/i.test(value)
    ? value
    : "/profile/orders";
}

export function signInUrl(returnTo: string) {
  return `/sign-in?redirect_url=${encodeURIComponent(safeReturnTo(returnTo))}`;
}
