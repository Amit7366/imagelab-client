import Image from "next/image";

const LOCKUP = { width: 684, height: 122 };

type BrandLogoProps = {
  tone?: "on-dark" | "on-light";
  variant?: "lockup" | "mark";
  height?: number;
  className?: string;
  priority?: boolean;
};

export function BrandLogo({
  tone = "on-dark",
  variant = "lockup",
  height = 32,
  className,
  priority = false,
}: BrandLogoProps) {
  if (variant === "mark") {
    return (
      <Image
        src="/brand/mark.png"
        alt="Imagelab"
        width={height}
        height={height}
        priority={priority}
        className={className}
        style={{ height, width: "auto" }}
      />
    );
  }

  const src = tone === "on-dark" ? "/brand/logo-dark.png" : "/brand/logo-light.png";
  const width = Math.round(height * (LOCKUP.width / LOCKUP.height));

  return (
    <Image
      src={src}
      alt="Imagelab"
      width={width}
      height={height}
      priority={priority}
      className={className}
      style={{ height, width: "auto" }}
    />
  );
}
