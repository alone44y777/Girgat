// Dark Empire Chameleon (Girgit) Dual-Face Image & Hosting API
// Power by Dark Empire | Owner: Sardar Daud Arain

import sharp from 'sharp';

const BRANDING = {
  power_by: 'Dark Empire',
  owner: 'Sardar Daud Arain'
};

// Base64 string ko clean Buffer mein convert karna
function decodeBase64Image(input) {
  if (!input || typeof input !== 'string') {
    throw new Error('Invalid image_base64 input.');
  }
  const clean = input.includes(',') ? input.split(',')[1] : input;
  return Buffer.from(clean, 'base64');
}

// Catbox.moe par direct PNG host karna (Bina compression ke)
async function uploadToCatbox(pngBuffer, filename = 'dark-empire-chameleon.png') {
  const form = new FormData();
  form.append('reqtype', 'fileupload');
  const blob = new Blob([pngBuffer], { type: 'image/png' });
  form.append('fileToUpload', blob, filename);

  const response = await fetch('https://catbox.moe/user/api.php', {
    method: 'POST',
    body: form
  });

  if (!response.ok) {
    throw new Error('Hosting server busy hai, dobara try karein.');
  }

  const url = (await response.text()).trim();
  if (!url.startsWith('http')) {
    throw new Error('Upload failed: ' + url);
  }
  return url;
}

// Core Chameleon (Mirage Tank) Pixel Math Engine
async function generateChameleonPng(lightBuf, darkBuf, size = 512) {
  // Dono images ko fast C++ engine se parallel resize + grayscale karna
  const [lightRaw, darkRaw] = await Promise.all([
    sharp(lightBuf)
      .resize(size, size, { fit: 'cover', position: 'center' })
      .greyscale()
      .raw()
      .toBuffer(),
    sharp(darkBuf)
      .resize(size, size, { fit: 'cover', position: 'center' })
      .greyscale()
      .raw()
      .toBuffer()
  ]);

  const totalPixels = size * size;
  const outputRgba = Buffer.allocUnsafe(totalPixels * 4);

  for (let i = 0; i < totalPixels; i++) {
    // Light Mode image ko bright range (128 - 255) mein map karna
    const a = 128 + ((lightRaw[i] * 127) / 255);
    // Dark Mode image ko dark range (0 - 127) mein map karna
    const b = (darkRaw[i] * 127) / 255;

    // Transparency (Alpha) aur Final Gray Color calculate karna
    let alpha = Math.round(255 - a + b);
    if (alpha < 1) alpha = 1;
    if (alpha > 255) alpha = 255;

    let gray = Math.round((b * 255) / alpha);
    if (gray < 0) gray = 0;
    if (gray > 255) gray = 255;

    const idx = i * 4;
    outputRgba[idx]     = gray;  // R
    outputRgba[idx + 1] = gray;  // G
    outputRgba[idx + 2] = gray;  // B
    outputRgba[idx + 3] = alpha; // A (Transparency)
  }

  // Fast PNG encoding
  return sharp(outputRgba, {
    raw: { width: size, height: size, channels: 4 }
  })
    .png({ compressionLevel: 6 })
    .toBuffer();
}

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // GET Request: API Status & Documentation
  if (req.method === 'GET') {
    return res.status(200).json({
      status: true,
      api_name: 'Dark Empire Chameleon Dual-Face Image API',
      speed: 'Ultra-Fast (Sharp C++ Engine)',
      actions: {
        generate: 'POST { action: "generate", light_image, dark_image, mode: "sticker" | "hd", auto_upload: false }',
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
    const body = req.body || {};
    const action = (body.action || 'generate').toLowerCase().trim();

    // 1. GENERATE CHAMELEON IMAGE
    if (action === 'generate') {
      const { light_image, dark_image, mode = 'sticker', auto_upload = false } = body;

      if (!light_image || !dark_image) {
        return res.status(400).json({
          status: false,
          error: 'light_image aur dark_image dono (Base64) required hain.',
          branding: BRANDING
        });
      }

      // Sticker = 512x512 (WhatsApp Ready), HD = 720x720 (Fast & Sharp)
      const size = mode === 'hd' ? 720 : 512;

      const startTime = Date.now();
      const lightBuf = decodeBase64Image(light_image);
      const darkBuf = decodeBase64Image(dark_image);

      const pngBuffer = await generateChameleonPng(lightBuf, darkBuf, size);
      const base64Result = 'data:image/png;base64,' + pngBuffer.toString('base64');

      let hostedUrl = null;
      let embedCode = null;

      if (auto_upload) {
        hostedUrl = await uploadToCatbox(pngBuffer);
        embedCode = `<img src="${hostedUrl}" alt="Dark Empire Chameleon" />`;
      }

      return res.status(200).json({
        status: true,
        action: 'generate',
        mode,
        resolution: `${size}x${size}`,
        process_time_ms: Date.now() - startTime,
        image_base64: base64Result,
        hosted_url: hostedUrl,
        embed_code: embedCode,
        branding: BRANDING
      });
    }

    // 2. DIRECT IMAGE-TO-LINK UPLOAD
    if (action === 'upload') {
      const { image_base64 } = body;
      if (!image_base64) {
        return res.status(400).json({
          status: false,
          error: 'image_base64 required hai.',
          branding: BRANDING
        });
      }

      const pngBuffer = decodeBase64Image(image_base64);
      const hostedUrl = await uploadToCatbox(pngBuffer);

      return res.status(200).json({
        status: true,
        action: 'upload',
        hosted_url: hostedUrl,
        embed_code: `<img src="${hostedUrl}" alt="Dark Empire Chameleon" />`,
        branding: BRANDING
      });
    }

    return res.status(400).json({
      status: false,
      error: 'Invalid action. "generate" ya "upload" use karein.',
      branding: BRANDING
    });

  } catch (err) {
    return res.status(500).json({
      status: false,
      error: 'Server Error: ' + err.message,
      branding: BRANDING
    });
  }
}
