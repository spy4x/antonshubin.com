// Capped request-body reading for every POST route (#251). `req.json()` and
// `req.formData()` buffer the whole body, so one large unauthenticated request
// could push the container past its memory limit. These read through
// `@spy4x/net/bounded-body` (and, for forms, `@spy4x/server/http/bounded-body`,
// which reuses it) instead, which checks a declared Content-Length
// before reading and the running total while streaming.
import {
  BodyReadTimeoutError,
  PayloadTooLargeError,
  readBoundedJson,
} from "@spy4x/net/bounded-body";
import { parseBoundedFormData } from "@spy4x/server/http/bounded-body";

/** `/api/subscribe` and `/unsubscribe`: an address or a token is a few hundred
 * bytes, so 4 KiB leaves room for any real form and nothing more. */
export const SMALL_FORM_MAX_BYTES = 4 * 1024;

/** `/api/lead`: the tech-stack field is free text; 64 KiB is about ten
 * thousand words, far more than anyone types into the form. */
export const LEAD_MAX_BYTES = 64 * 1024;

/** A body read that failed: the status to answer and a short reason. */
export interface BodyError {
  ok: false;
  /** 413 over the cap, 408 when the body stalls, 400 when it does not parse. */
  status: 400 | 408 | 413;
  error: string;
}

/** Maps a failed bounded read onto its HTTP answer. */
function bodyError(err: unknown, invalid: string): BodyError {
  if (err instanceof PayloadTooLargeError) {
    return { ok: false, status: 413, error: "Request body too large" };
  }
  if (err instanceof BodyReadTimeoutError) {
    return { ok: false, status: 408, error: "Request body timed out" };
  }
  return { ok: false, status: 400, error: invalid };
}

/** Reads a JSON body of at most `maxBytes` bytes; `invalid` is the error
 * text for a body that is not JSON. */
export async function readJsonBody(
  req: Request,
  maxBytes: number,
  invalid = "Invalid JSON",
): Promise<{ ok: true; value: unknown } | BodyError> {
  try {
    return { ok: true, value: await readBoundedJson(req, { maxBytes }) };
  } catch (err) {
    return bodyError(err, invalid);
  }
}

/**
 * Reads a form body (url-encoded or multipart) of at most `maxBytes` bytes
 * through `parseBoundedFormData` from `@spy4x/server`, which reads the bytes
 * under the cap before the platform's form parser sees them. A body with no
 * Content-Type, or one that does not parse as a form, is a 400, as
 * `req.formData()` answered before (#251).
 */
export async function readFormBody(
  req: Request,
  maxBytes: number,
): Promise<{ ok: true; value: FormData } | BodyError> {
  try {
    return { ok: true, value: await parseBoundedFormData(req, { maxBytes }) };
  } catch (err) {
    return bodyError(err, "Invalid form body");
  }
}
