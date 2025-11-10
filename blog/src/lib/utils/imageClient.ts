// 브라우저에서 WebP 변환 및 리사이징 유틸
// md 요구사항: browser-image-compression 사용 + WebP 변환(최대 1920px, 품질 80~85)
import imageCompression from 'browser-image-compression';

export type CompressOptions = { maxWidth?: number; quality?: number };

export async function compressToWebp(file: File, opts: CompressOptions = {}) {
  const maxWidth = opts.maxWidth ?? 1920;
  const quality = opts.quality ?? 0.82; // 82%

  // 1차: 라이브러리로 리사이징/압축(원본 타입 유지)
  const prelim = await imageCompression(file, {
    maxWidth,
    useWebWorker: true,
    maxSizeMB: undefined,
    initialQuality: quality,
  });

  // 2차: Canvas로 WebP로 변환
  const blob = await blobToWebp(prelim, quality);
  const name = file.name.replace(/\.[^.]+$/, '') + '.webp';
  const webpFile = new File([blob], name, { type: 'image/webp' });
  return webpFile;
}

async function blobToWebp(blob: Blob, quality: number) {
  const url = URL.createObjectURL(blob);
  try {
    const img = await loadImage(url);
    const { width, height } = img;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('canvas_context');
    ctx.drawImage(img, 0, 0, width, height);
    const webp = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('toBlob_failed'))), 'image/webp', quality);
    });
    return webp;
  } finally {
    URL.revokeObjectURL(url);
  }
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(e);
    img.src = src;
  });
}

