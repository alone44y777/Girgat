// ============================================================================
// DARK EMPIRE CHAMELEON (GIRGIT) DUAL-FACE IMAGE ENGINE — v3.0 PRO
// Power by: Dark Empire | Owner: Sardar Daud Arain
// Engine: Sharp C++ Native Pipeline + Multi-Fallback PNG Hosting
// ============================================================================

import sharp from 'sharp';

const BRANDING = Object.freeze({
  power_by: 'Dark Empire',
  owner: 'Sardar Daud Arain',
  version: '3.0-PRO'
});

const MAX_INPUT_BYTES = 4 * 1024 * 1024; // 4 MB safety cap per image

// Strict Base64 to Buffer decoder with size validation
function decodeBase64Image(input, fieldName = 'image') {
  if (!input || typeof input !== 'string') {
    throw new Error(`${fieldName} missing ya invalid hai.`);
  }
  const clean = input.includes(',') ? input.split(',')[1].trim() : input.trim();
  const buf = Buffer.from(clean, 'base64');

  if (!buf.length) {
    throw new Error(`${fieldName} empty hai.`);
  }
  if (buf.length > MAX_INPUT_BYTES) {
    throw new Error(`${fieldName} 4MB se bari hai. Chhoti image use karein.`);
  }
  return buf;
}

// Ultra-Fast Hosting with 8s Anti-Hang Timeout & Automatic Fallback
async function uploadPngReliable(pngBuffer, filename = 'dark-empire-chameleon.png') {
  // Tier 1: FreeImage.host (Permanent Direct PNG)
  try {
    const form = new FormData();
    form.append('key', '6d207e02198a847aa98d0a2a901485a5');
    form.append('action', 'upload');
    form.append('source', pngBuffer.toString('base64'));
    form.append('format', 'json');

    const res = await fetch('https://freeimage.host/api/1/upload', {
      method: 'POST',
      body: form,
      signal: AbortSignal.timeout(8000)
    });

    if (res.ok) {
      const json = await res.json();
      if (json?.image?.url) {
        return { url: json.image.url, host: 'freeimage.host' };
      }
    }
  } catch (_) {
    // Silent fallback to Tier 2
  }

  // Tier 2: TmpFiles.org (Direct Uncompressed PNG)
  try {
    const form2 = new FormData();
    const blob = new Blob([pngBuffer], { type: 'image/png' });
    form2.append('file', blob, filename);

    const res2 = await fetch('https://tmpfiles.org/api/v1/upload', {
      method: 'POST',
      body: form2,
      signal: AbortSignal.timeout(8000)
    });

    if (res2.ok) {
      const json2 = await res2.json();
      if (json2?.data?.url) {
        const directUrl = json2.data.url.replace('tmpfiles.org/', 'tmpfiles.org/dl/');
        return { url: directUrl, host: 'tmpfiles.org' };
      }
    }
  } catch (_) {
    // All tiers exhausted
  }

  throw new Error('Hosting servers abhi busy hain. Thori dair baad dobara try karein.');
}

// Core High-Precision Chameleon (Mirage Tank) Pixel Engine
async function generateChameleonPng(lightBuf, darkBuf, size = 512, contrast = 'high') {
  // Parallel C++ processing: Auto-rotate, Resize, Greyscale, Normalize, Sharpen
  const [lightRaw, darkRaw] = await Promise.all([
    sharp(lightBuf)
      .rotate() // EXIF auto-orient (mobile photos seedhi rahengi)
      .resize(size, size, { fit: 'cover', position: 'centre', kernel: sharp.kernel.lanczos3 })
      .greyscale()
      .normalize()
      .sharpen({ sigma: 1.2 })
      .raw()
      .toBuffer(),
    sharp(darkBuf)
      .rotate()
      .resize(size, size, { fit: 'cover', position: 'centre', kernel: sharp.kernel.lanczos3 })
      .greyscale()
      .normalize()
      .sharpen({ sigma: 1.2 })
      .raw()
      .toBuffer()
  ]);

  const totalPixels = size * size;
  const outputRgba = Buffer.allocUnsafe(totalPixels * 4);

  // Strict luminance separation (High contrast = less ghosting)
  const lightFloor = contrast === 'high' ? 145 : 130;
  const lightRange = 255 - lightFloor;
  const darkCeiling = contrast === 'high' ? 110 : 125;

  for (let i = 0; i < totalPixels; i++) {
    // Map Light image to upper bright band [lightFloor .. 255]
    const a = lightFloor + ((lightRaw[i] * lightRange) / 255);
    // Map Dark image to lower dark band [0 .. darkCeiling]
    const b = (darkRaw[i] * darkCeiling) / 255;

    // Exact Mirage Tank Alpha & Color equations:
    // White BG (255): out = gray * (alpha/255) + 255 * (1 - alpha/255) = a
    // Black BG (0):   out = gray * (alpha/255) = b
    let alpha = Math.round(255 - a + b);
    if (alpha < 1) alpha = 1;
    else if (alpha > 255) alpha = 255;

    let gray = Math.round((b * 255) / alpha);
    if (gray < 0) gray = 0;
    else if (gray > 255) gray = 255;

    const idx = i * 4;
    outputRgba[idx]     = gray;
    outputRgba[idx + 1] = gray;
    outputRgba[idx + 2] = gray;
    outputRgba[idx + 3] = alpha;
  }

  return sharp(outputRgba, {
    raw: { width: size, height: size, channels: 4 }
  })
    .png({ compressionLevel: 6, adaptiveFiltering: true })
    .toBuffer();
}

export default async function handler(req, res) {
  // Global CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Health Check & API Info
  if (req.method === 'GET') {
    return res.status(200).json({
      status: true,
      api_name: 'Dark Empire Chameleon Dual-Face Image API',
      engine: 'Sharp C++ Native (Lanczos3 + Sharpen + EXIF Auto-Rotate)',
      modes: {
        sticker: '512x512',
        hd: '800x800',
        ultra: '1024x1024'
      },
      actions: {
        generate: 'POST { action: "generate", light_image, dark_image, mode: "sticker"|"hd"|"ultra", contrast: "high"|"normal", auto_upload: false }',
        upload: 'POST { action: "upload", image_base64 }'
      },
      branding: BRANDING
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({
      status: false,
      error: 'Sirf GET aur POST requests allowed hain.',
      branding: BRANDING
    });
  }

  try {
    // Safe body parsing (handles both parsed JSON and raw string)
    let body = req.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch { body = {}; }
    }
    body = body || {};

    const action = String(body.action || 'generate').toLowerCase().trim();

    // ACTION 1: GENERATE CHAMELEON PNG
    if (action === 'generate') {
      const {
        light_image,
        dark_image,
        mode = 'sticker',
        contrast = 'high',
        auto_upload = false
      } = body;

      const sizeMap = { sticker: 512, hd: 800, ultra: 1024 };
      const size = sizeMap[mode] || 512;

      const startTime = Date.now();
      const lightBuf = decodeBase64Image(light_image, 'light_image');
      const darkBuf = decodeBase64Image(dark_image, 'dark_image');

      const pngBuffer = await generateChameleonPng(lightBuf, darkBuf, size, contrast);
      const base64Result = 'data:image/png;base64,' + pngBuffer.toString('base64');

      let hostedUrl = null;
      let hostProvider = null;
      let embedCode = null;

      if (auto_upload) {
        const uploaded = await uploadPngReliable(pngBuffer);
        hostedUrl = uploaded.url;
        hostProvider = uploaded.host;
        embedCode = `<img src="${hostedUrl}" alt="Dark Empire Chameleon" />`;
      }

      return res.status(200).json({
        status: true,
        action: 'generate',
        mode,
        contrast,
        resolution: `${size}x${size}`,
        size_kb: Math.round(pngBuffer.length / 1024),
        process_time_ms: Date.now() - startTime,
        image_base64: base64Result,
        hosted_url: hostedUrl,
        host_provider: hostProvider,
        embed_code: embedCode,
        branding: BRANDING
      });
    }

    // ACTION 2: DIRECT IMAGE-TO-LINK HOSTING
    if (action === 'upload') {
      const pngBuffer = decodeBase64Image(body.image_base64, 'image_base64');
      const startTime = Date.now();
      const uploaded = await uploadPngReliable(pngBuffer);

      return res.status(200).json({
        status: true,
        action: 'upload',
        host_provider: uploaded.host,
        size_kb: Math.round(pngBuffer.length / 1024),
        upload_time_ms: Date.now() - startTime,
        hosted_url: uploaded.url,
        embed_code: `<img src="${uploaded.url}" alt="Dark Empire Chameleon" />`,
        branding: BRANDING
      });
    }

    return res.status(400).json({
      status: false,
      error: 'Invalid action. Sirf "generate" ya "upload" use karein.',
      branding: BRANDING
    });

  } catch (err) {
    return res.status(500).json({
      status: false,
      error: err.message || 'Internal Server Error',
      branding: BRANDING
    });
  }
}
