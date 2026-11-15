export interface SharedPlaygroundPayload {
  code: string;
  stdin?: string;
  fileName?: string;
}

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlToBytes(encoded: string): Uint8Array {
  const padded = encoded.replace(/-/g, '+').replace(/_/g, '/');
  const padLen = (4 - (padded.length % 4)) % 4;
  const base64 = padded + '='.repeat(padLen);
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export function encodeSharedPlaygroundState(payload: SharedPlaygroundPayload): string {
  const compact: { c: string; s?: string; f?: string } = { c: payload.code };
  if (payload.stdin) compact.s = payload.stdin;
  if (payload.fileName && payload.fileName !== 'main.py') compact.f = payload.fileName;

  const json = JSON.stringify(compact);
  const bytes = new TextEncoder().encode(json);
  return bytesToBase64Url(bytes);
}

export function decodeSharedPlaygroundState(encoded: string): SharedPlaygroundPayload | null {
  try {
    if (!encoded || encoded.length > 32000) return null;
    const bytes = base64UrlToBytes(encoded);
    const json = new TextDecoder().decode(bytes);
    const parsed = JSON.parse(json) as { c?: unknown; s?: unknown; f?: unknown };
    if (typeof parsed.c !== 'string') return null;

    return {
      code: parsed.c,
      stdin: typeof parsed.s === 'string' ? parsed.s : '',
      fileName: typeof parsed.f === 'string' && parsed.f.trim() ? parsed.f.trim() : 'main.py',
    };
  } catch {
    return null;
  }
}

export function buildSharePlaygroundUrl(payload: SharedPlaygroundPayload): string {
  const token = encodeSharedPlaygroundState(payload);
  const url = new URL(window.location.href);
  url.search = '';
  url.hash = '';
  url.searchParams.set('view', 'playground');
  url.searchParams.set('share', token);
  return url.toString();
}

export function readSharedPlaygroundFromLocation(): SharedPlaygroundPayload | null {
  try {
    const params = new URLSearchParams(window.location.search);
    const shareToken = params.get('share');
    if (!shareToken) return null;
    return decodeSharedPlaygroundState(shareToken);
  } catch {
    return null;
  }
}

export async function copyTextToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Fallback below
  }

  try {
    const helper = document.createElement('textarea');
    helper.value = text;
    helper.setAttribute('readonly', '');
    helper.style.position = 'fixed';
    helper.style.left = '-9999px';
    document.body.appendChild(helper);
    helper.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(helper);
    return ok;
  } catch {
    return false;
  }
}
