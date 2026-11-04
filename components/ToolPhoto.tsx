import Image from "next/image";
import { categoryPhoto } from "@/lib/photos";

export function ToolPhoto({
  category,
  src,
  name,
  className = "",
  sizes = "(max-width: 640px) 100vw, 320px",
  eager = false,
}: {
  category: string;
  src?: string | null;
  name?: string;
  className?: string;
  sizes?: string;
  eager?: boolean;
}) {
  const photo = categoryPhoto(category);
  return (
    <div className={`tool-photo ${className}`}>
      {src ? (
        <Image src={src} alt={name ?? ""} fill sizes={sizes} unoptimized loading={eager ? "eager" : "lazy"} />
      ) : (
        <Image src={photo.src} alt={photo.alt} fill sizes={sizes} loading={eager ? "eager" : "lazy"} />
      )}
    </div>
  );
}
