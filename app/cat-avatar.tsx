import Image from "next/image";
import { AVATAR_ACCESSORIES, AVATAR_COATS, AvatarCustomization, DEFAULT_AVATAR } from "@/lib/legioncoin";

type CatAvatarProps = {
  customization?: AvatarCustomization;
  size?: number;
  className?: string;
  alt?: string;
  priority?: boolean;
};

export default function CatAvatar({
  customization = DEFAULT_AVATAR,
  size = 64,
  className = "",
  alt = "",
  priority = false,
}: CatAvatarProps) {
  const coat = AVATAR_COATS.find((option) => option.id === customization.coat) || AVATAR_COATS[0];
  const accessory = AVATAR_ACCESSORIES.find((option) => option.id === customization.accessory) || AVATAR_ACCESSORIES[0];
  const accessoryFontSize = Math.max(11, Math.round(size * 0.15));
  const imageFilter = coat.filter === "none"
    ? "drop-shadow(0 5px 8px #0007)"
    : `${coat.filter} drop-shadow(0 5px 8px #0007)`;

  return (
    <span
      className={`cat-avatar ${className}`.trim()}
      style={{ width: size, height: size }}
      data-coat={coat.id}
      data-accessory={accessory.id}
      role={alt ? "img" : undefined}
      aria-label={alt || undefined}
    >
      <Image
        className="cat-avatar-image"
        src="/images/legion-cat-mascot-512.png"
        width={size}
        height={size}
        alt=""
        priority={priority}
        style={{ filter: imageFilter }}
      />
      {accessory.symbol && (
        <span className={`cat-avatar-accessory cat-avatar-accessory-${accessory.id}`} style={{ fontSize: accessoryFontSize }} aria-hidden="true">
          {accessory.symbol}
        </span>
      )}
    </span>
  );
}
