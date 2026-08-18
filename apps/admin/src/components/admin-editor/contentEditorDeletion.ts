/** Keeps a successful row deletion final even when body-file cleanup fails. */
export async function deleteRowThenCleanContentScope(
  deleteRow: () => Promise<void>,
  cleanContentScope: () => Promise<unknown>,
  reportCleanupFailure: () => void,
): Promise<void> {
  await deleteRow()

  try {
    await cleanContentScope()
  } catch {
    reportCleanupFailure()
  }
}
