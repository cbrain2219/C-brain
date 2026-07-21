import Image from "next/image";
import type { CSSProperties } from "react";

import {
  featuredPartnerClients,
  partnerClientRows,
} from "../_content/partners";
import styles from "../page.module.css";

const marqueeFeaturedClients = featuredPartnerClients.map((client) => ({
  alt: client.alt,
  height: client.marqueeHeight,
  src: client.src,
  width: client.marqueeWidth,
}));

const marqueeClients = [...marqueeFeaturedClients, ...partnerClientRows.flat()];
const marqueeClientRows = [
  marqueeClients.filter((_, index) => index % 2 === 0),
  marqueeClients.filter((_, index) => index % 2 === 1),
] as const;
const companyPartnerClientRows = [
  [...partnerClientRows[0], ...partnerClientRows[1].slice(0, 3)],
  [...partnerClientRows[1].slice(3), ...partnerClientRows[2]],
] as const;

const getLogoImageStyle = (width: number, height: number) =>
  ({
    "--partner-logo-height": `${height}px`,
    "--partner-logo-width": `${width}px`,
  }) as CSSProperties;

type PartnerLogoCloudProps = {
  ariaLabel?: string;
  className?: string;
  variant?: "default" | "company";
};

export function PartnerLogoCloud({
  ariaLabel = "고객사 로고",
  className,
  variant = "default",
}: PartnerLogoCloudProps) {
  const staticClientRows =
    variant === "company" ? companyPartnerClientRows : partnerClientRows;
  const staticClassName = [
    styles.reviewLogoCloud,
    styles.reviewLogoCloudStatic,
    variant === "company" ? styles.reviewLogoCloudCompany : "",
    className ?? "",
  ]
    .filter(Boolean)
    .join(" ");
  const marqueeClassName = [
    styles.reviewLogoMarquee,
    variant === "company" ? styles.reviewLogoMarqueeCompany : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <>
      <div className={staticClassName} aria-label={ariaLabel}>
        <div className={styles.featuredClientLogos}>
          {featuredPartnerClients.map((client) => (
            <span className={styles.featuredClientLogo} key={client.src}>
              <Image
                alt={client.alt}
                className={styles.partnerLogoImage}
                height={client.height}
                src={client.src}
                style={getLogoImageStyle(client.width, client.height)}
                width={client.width}
              />
            </span>
          ))}
        </div>
        <div className={styles.reviewClientLogoRows}>
          {staticClientRows.map((row) => (
            <div className={styles.reviewClientLogoRow} key={row[0].src}>
              {row.map((client) => (
                <span className={styles.reviewClientLogo} key={client.src}>
                  <Image
                    alt={client.alt}
                    className={styles.partnerLogoImage}
                    height={client.height}
                    src={client.src}
                    style={getLogoImageStyle(client.width, client.height)}
                    width={client.width}
                  />
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className={marqueeClassName} aria-label={ariaLabel}>
        {marqueeClientRows.map((row, rowIndex) => (
          <div
            className={styles.reviewLogoMarqueeRow}
            key={`marquee-row-${rowIndex}`}
          >
            <div className={styles.reviewLogoMarqueeTrack}>
              {[0, 1].map((copyIndex) => (
                <div
                  aria-hidden={copyIndex === 1 ? true : undefined}
                  className={`${styles.reviewLogoMarqueeGroup} ${
                    copyIndex === 1
                      ? styles.reviewLogoMarqueeGroupDuplicate
                      : ""
                  }`}
                  key={`marquee-copy-${copyIndex}`}
                >
                  {row.map((client) => (
                    <span
                      className={styles.reviewMarqueeLogo}
                      key={`${copyIndex}-${client.src}`}
                    >
                      <Image
                        alt={copyIndex === 1 ? "" : client.alt}
                        className={styles.partnerLogoImage}
                        height={client.height}
                        loading="eager"
                        src={client.src}
                        style={getLogoImageStyle(client.width, client.height)}
                        width={client.width}
                      />
                    </span>
                  ))}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
