export class RentalError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RentalError";
  }
}
export type ActionResult = { ok: true } | { ok: false; error: string };
export function actionError(
  error: unknown,
  fallback = "This action could not be completed. Please try again.",
) {
  return error instanceof RentalError ? error.message : fallback;
}
export async function runAction(
  work: () => Promise<void>,
): Promise<ActionResult> {
  try {
    await work();
    return { ok: true };
  } catch (error) {
    return { ok: false, error: actionError(error) };
  }
}
