import Image from "next/image";
import type { CSSProperties } from "react";

import {
  featuredPartnerClients,
  partnerClientRows,
} from "../_content/partners";
import styles from "../page.module.css";

type PartnerLogo = {
  alt: string;
  height: number;
  src: string;
  width: number;
};

const createMarqueeRows = (clients: readonly PartnerLogo[]) =>
  [
    clients.filter((_, index) => index % 2 === 0),
    clients.filter((_, index) => index % 2 === 1),
  ] as const;

const partnerMarqueeClientRows = createMarqueeRows(partnerClientRows.flat());
const companyPartnerClientRows = [
  [...partnerClientRows[0], ...partnerClientRows[1].slice(0, 3)],
  [...partnerClientRows[1].slice(3), ...partnerClientRows[2]],
] as const;

const compactPartnerLogoScale = 0.75;

const getLogoImageStyle = (width: number, height: number) =>
  ({
    "--partner-logo-compact-height": `${height * compactPartnerLogoScale}px`,
    "--partner-logo-compact-width": `${width * compactPartnerLogoScale}px`,
    "--partner-logo-height": `${height}px`,
    "--partner-logo-width": `${width}px`,
  }) as CSSProperties;

type PartnerLogoMarqueeProps = {
  className: string | undefined;
  logoClassName: string | undefined;
  rows: readonly (readonly PartnerLogo[])[];
};

function PartnerLogoMarquee({
  className,
  logoClassName,
  rows,
}: PartnerLogoMarqueeProps) {
  return (
    <div className={className}>
      {rows.map((row, rowIndex) => (
        <div
          className={styles.reviewLogoMarqueeRow}
          key={`marquee-row-${rowIndex}`}
        >
          <div className={styles.reviewLogoMarqueeTrack}>
            {[0, 1].map((copyIndex) => (
              <div
                aria-hidden={copyIndex === 1 ? true : undefined}
                className={`${styles.reviewLogoMarqueeGroup} ${
                  copyIndex === 1 ? styles.reviewLogoMarqueeGroupDuplicate : ""
                }`}
                key={`marquee-copy-${copyIndex}`}
              >
                {row.map((client) => (
                  <span
                    className={logoClassName}
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
  );
}

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
  const isCompanyVariant = variant === "company";
  const staticClientRows = isCompanyVariant
    ? companyPartnerClientRows
    : partnerClientRows;
  const logoCloudClassName = [
    styles.reviewLogoCloud,
    isCompanyVariant ? styles.reviewLogoCloudCompany : "",
    className ?? "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={logoCloudClassName} aria-label={ariaLabel}>
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
      <PartnerLogoMarquee
        className={styles.featuredClientLogoMarquee}
        logoClassName={styles.featuredClientLogo}
        rows={[featuredPartnerClients]}
      />
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
      <PartnerLogoMarquee
        className={`${styles.reviewLogoMarquee} ${styles.reviewLogoMarqueePartners}`}
        logoClassName={styles.reviewMarqueeLogo}
        rows={partnerMarqueeClientRows}
      />
    </div>
  );
}
