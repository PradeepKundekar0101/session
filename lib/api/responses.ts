import { NextResponse } from "next/server";

export function jsonOk<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

export function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export function jsonUnauthorized() {
  return jsonError("Unauthorized", 401);
}

export function jsonForbidden() {
  return jsonError("Forbidden", 403);
}

export function jsonNotFound() {
  return jsonError("Not found", 404);
}
