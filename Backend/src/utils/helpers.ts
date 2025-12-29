import crypto from 'crypto';

export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

export function generateOrderNumber(): string {
  const timestamp = Date.now();
  const random = crypto.randomBytes(2).readUInt16BE(0) % 10000;
  return `ORD-${timestamp}-${random.toString().padStart(4, '0')}`;
}

