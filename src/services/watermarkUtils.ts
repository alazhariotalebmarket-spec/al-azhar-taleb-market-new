export const ORG_WATERMARK_LOGO_FALLBACK =
  '/assets/aistudio/output-onlinepngtools_11zon_90870e8e.png';

const imageLoadCache = new Map<string, Promise<HTMLImageElement | null>>();

function shouldUseAnonymousCors(src: string): boolean {
  if (src.startsWith('data:') || src.startsWith('blob:') || src.startsWith('/')) {
    return false;
  }
  try {
    if (typeof window !== 'undefined' && window.location?.origin) {
      const parsed = new URL(src, window.location.origin);
      return parsed.origin !== window.location.origin;
    }
  } catch {
    return false;
  }
  return false;
}

function loadViaImageElement(src: string, useCors: boolean): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    try {
      const img = new Image();
      if (useCors) {
        img.crossOrigin = 'anonymous';
      }
      let settled = false;
      const done = (result: HTMLImageElement | null) => {
        if (settled) return;
        settled = true;
        resolve(result);
      };
      img.onload = () => done(img.naturalWidth > 0 ? img : null);
      img.onerror = () => done(null);
      img.src = src;
      if (img.complete && img.naturalWidth > 0) {
        done(img);
        return;
      }
      setTimeout(() => done(null), 4000);
    } catch {
      resolve(null);
    }
  });
}

async function loadViaFetchBlob(src: string): Promise<HTMLImageElement | null> {
  if (typeof fetch !== 'function' || src.startsWith('data:') || src.startsWith('blob:')) {
    return null;
  }
  try {
    const res = await fetch(src, { credentials: 'same-origin' });
    if (!res.ok) return null;
    const blob = await res.blob();
    const objectUrl = URL.createObjectURL(blob);
    const img = await loadViaImageElement(objectUrl, false);
    if (!img) {
      URL.revokeObjectURL(objectUrl);
      return null;
    }
    return img;
  } catch {
    return null;
  }
}

function loadSingleImage(src: string): Promise<HTMLImageElement | null> {
  const existing = imageLoadCache.get(src);
  if (existing) return existing;

  const promise = (async () => {
    const useCors = shouldUseAnonymousCors(src);
    let img = await loadViaImageElement(src, useCors);
    if (!img && useCors) {
      img = await loadViaImageElement(src, false);
    }
    if (!img) {
      img = await loadViaFetchBlob(src);
    }
    if (!img) {
      imageLoadCache.delete(src);
    }
    return img;
  })();

  imageLoadCache.set(src, promise);
  return promise;
}

export async function loadCachedLogoImage(src?: string): Promise<HTMLImageElement | null> {
  const primary = (src || '').trim();
  if (primary) {
    const img = await loadSingleImage(primary);
    if (img) return img;
  }
  if (primary !== ORG_WATERMARK_LOGO_FALLBACK) {
    return loadSingleImage(ORG_WATERMARK_LOGO_FALLBACK);
  }
  return null;
}

/**
 * Draws a large, centered, subtle circular logo watermark (10-15% opacity).
 * Call this AFTER drawing background/card fills and BEFORE drawing text and borders
 * so the watermark stays strictly behind all document text.
 */
export function drawCenteredLogoWatermark(
  ctx: CanvasRenderingContext2D,
  pageWidth: number,
  pageHeight: number,
  logoImg: HTMLImageElement | null,
  alpha = 0.14
): void {
  if (!logoImg) return;
  const diameter = Math.round(Math.min(pageWidth * 0.72, pageHeight * 0.56));
  const cx = pageWidth / 2;
  const cy = pageHeight / 2;
  const x = cx - diameter / 2;
  const y = cy - diameter / 2;

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.globalCompositeOperation = 'multiply';
  ctx.beginPath();
  ctx.arc(cx, cy, diameter / 2, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();
  ctx.drawImage(logoImg, x, y, diameter, diameter);
  ctx.restore();
}

export function canvasToPngBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    if (typeof canvas.toBlob === 'function') {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to encode canvas PNG'));
          }
        },
        'image/png',
        0.95
      );
      return;
    }
    try {
      const dataUrl = canvas.toDataURL('image/png');
      const [, base64] = dataUrl.split(',');
      const bin = atob(base64 || '');
      const bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i += 1) {
        bytes[i] = bin.charCodeAt(i);
      }
      resolve(new Blob([bytes], { type: 'image/png' }));
    } catch (err) {
      reject(err);
    }
  });
}

export function mergeCanvasesVertically(canvases: HTMLCanvasElement[]): HTMLCanvasElement {
  if (canvases.length === 0) {
    const empty = document.createElement('canvas');
    empty.width = 1240;
    empty.height = 1754;
    return empty;
  }
  if (canvases.length === 1) {
    return canvases[0];
  }

  const gap = 16;
  const width = Math.max(...canvases.map((c) => c.width));
  const totalHeight =
    canvases.reduce((sum, c) => sum + c.height, 0) + gap * (canvases.length - 1);

  const merged = document.createElement('canvas');
  merged.width = width;
  merged.height = totalHeight;
  const ctx = merged.getContext('2d');
  if (!ctx) return canvases[0];

  ctx.fillStyle = '#e2e8f0';
  ctx.fillRect(0, 0, width, totalHeight);

  let offsetY = 0;
  canvases.forEach((c) => {
    ctx.drawImage(c, 0, offsetY);
    offsetY += c.height + gap;
  });

  return merged;
}

export function triggerBlobDownload(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 1500);
}
