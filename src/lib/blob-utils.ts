export function toBufferFromBlob(value: unknown): Buffer | null {
  if (Buffer.isBuffer(value)) {
    return value;
  }

  if (value instanceof ArrayBuffer) {
    return Buffer.from(value);
  }

  if (ArrayBuffer.isView(value)) {
    return Buffer.from(value.buffer, value.byteOffset, value.byteLength);
  }

  return null;
}
