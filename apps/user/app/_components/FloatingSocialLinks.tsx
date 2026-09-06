import Image from "next/image";

import {
  type CompanySocialLink,
  companySocialLinks,
} from "../_content/company";
import styles from "./FloatingSocialLinks.module.css";

const socialOrder = [
  "instagram",
  "naverBlog",
  "youtube",
] as const satisfies CompanySocialLink["id"][];

const iconById = {
  instagram: {
    className: styles.instagramIcon!,
    height: 32,
    src: "/figma-assets/floating-social-instagram.png",
    width: 32,
  },
  naverBlog: {
    className: styles.naverBlogIcon!,
    height: 46,
    src: "/figma-assets/floating-social-naver-blog.png",
    width: 61,
  },
  youtube: {
    className: styles.youtubeIcon!,
    height: 22,
    src: "/figma-assets/floating-social-youtube.png",
    width: 32,
  },
} as const satisfies Record<
  CompanySocialLink["id"],
  { className: string; height: number; src: string; width: number }
>;

const links = socialOrder.map((id) => {
  const link = companySocialLinks.find((social) => social.id === id);

  if (!link) throw new Error(`Missing social link: ${id}`);

  return { ...link, ...iconById[id] };
});

export function FloatingSocialLinks() {
  return (
    <nav aria-label="소셜 미디어" className={styles.links}>
      {links.map((link) => (
        <a
          aria-label={link.label}
          className={styles.link}
          href={link.href}
          key={link.id}
          rel="noopener noreferrer"
          target="_blank"
        >
          <span
            aria-hidden="true"
            className={`${styles.icon} ${
              link.id === "naverBlog" ? styles.naverBlogClip : ""
            }`}
          >
            <Image
              alt=""
              className={`${styles.iconImage} ${link.className}`}
              height={link.height}
              src={link.src}
              width={link.width}
            />
          </span>
        </a>
      ))}
    </nav>
  );
}
