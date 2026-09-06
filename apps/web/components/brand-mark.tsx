import Image from 'next/image';

export function BrandMark({
  size = 40,
  priority = false,
}: {
  size?: number;
  id?: string;
  priority?: boolean;
}) {
  return (
    <Image
      className="brand-mark"
      src="/logo.png"
      alt="STATWIN"
      width={size}
      height={size}
      priority={priority}
      style={{ width: size, height: size }}
    />
  );
}
