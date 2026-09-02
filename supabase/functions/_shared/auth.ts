export function isServiceRoleRequest(req: Request, serviceRoleKey: string | undefined): boolean {
  if (!serviceRoleKey) return false;
  return req.headers.get("authorization") === `Bearer ${serviceRoleKey}`;
}

export function jsonError(message: string, status: number, headers: HeadersInit): Response {
  return Response.json({ error: message }, {
    status,
    headers: { ...headers, "Content-Type": "application/json" },
  });
}
