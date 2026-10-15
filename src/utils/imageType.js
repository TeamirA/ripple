const SIGNATURES = [
  { mimeType: 'image/jpeg', bytes: [0xff, 0xd8, 0xff] },
  { mimeType: 'image/png', bytes: [0x89, 0x50, 0x4e, 0x47] },
  { mimeType: 'image/gif', bytes: [0x47, 0x49, 0x46, 0x38] },
  // WebP: "RIFF" ... "WEBP"
  { mimeType: 'image/webp', bytes: [0x52, 0x49, 0x46, 0x46], extra: { offset: 8, text: 'WEBP' } },
];

/** Detects an image type from its magic bytes instead of trusting the client's Content-Type. */
export function detectImageType(buffer) {
  const match = SIGNATURES.find(
    ({ bytes, extra }) =>
      bytes.every((byte, index) => buffer[index] === byte) &&
      (!extra ||
        buffer.toString('ascii', extra.offset, extra.offset + extra.text.length) === extra.text),
  );
  return match?.mimeType ?? null;
}
