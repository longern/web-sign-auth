import React, { useEffect, useState } from "react";

export function QRCode({
  text,
  fallback,
  width = 192,
}: {
  text: string;
  fallback?: React.ReactNode;
  width?: number;
}) {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    import("qrcode").then(async ({ toDataURL }) => {
      const url = await toDataURL(text, { width });
      setSrc(url);
    });
  }, [text, width]);

  const imgTag = <img src={src} alt="QR code" width={width} height={width} />;
  return src === null ? fallback : imgTag;
}

export default QRCode;
