import Image from "next/image";
import Link from "next/link";

import {
  type CompanySocialLink,
  companyProfile,
  companySocialLinks,
} from "../_content/company";
import styles from "../page.module.css";

const footerSocialOrder = [
  "instagram",
  "naverBlog",
  "youtube",
] as const satisfies CompanySocialLink["id"][];

const footerSocialIconById = {
  instagram: {
    icon: "/figma-assets/footer-instagram.png",
    imageClassName: styles.socialIconImageInstagram!,
    imageHeight: 20,
    imageWidth: 20,
  },
  naverBlog: {
    icon: "/figma-assets/footer-naver-blog.png",
    imageClassName: styles.socialIconImageBlog!,
    imageHeight: 29,
    imageWidth: 38,
  },
  youtube: {
    icon: "/figma-assets/footer-youtube.png",
    imageClassName: styles.socialIconImageYoutube!,
    imageHeight: 14,
    imageWidth: 20,
  },
} as const satisfies Record<
  CompanySocialLink["id"],
  {
    icon: string;
    imageClassName: string;
    imageHeight: number;
    imageWidth: number;
  }
>;

const socials = footerSocialOrder.map((id) => {
  const social = companySocialLinks.find((link) => link.id === id);

  if (!social) {
    throw new Error(`Missing footer social link: ${id}`);
  }

  return {
    ...social,
    ...footerSocialIconById[id],
  };
});

const policies = [
  { href: "#", label: "이용약관" },
  { href: "#", isStrong: true, label: "개인정보처리방침" },
  { href: "#", label: "취소 및 환불 규정" },
];

export function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.footerTop}>
        <Link aria-label="씨브레인 홈" className={styles.footerLogo} href="/">
          <Image
            alt={companyProfile.logo.main.alt}
            height={companyProfile.logo.main.footerHeight}
            src={companyProfile.logo.main.src}
            width={companyProfile.logo.main.width}
          />
          <Image
            alt={companyProfile.logo.tagline.alt}
            height={companyProfile.logo.tagline.footerHeight}
            src={companyProfile.logo.tagline.src}
            width={companyProfile.logo.tagline.width}
          />
        </Link>
        <div className={styles.socialLinks}>
          {socials.map((social) => (
            <a
              href={social.href}
              key={social.label}
              rel="noopener noreferrer"
              target="_blank"
            >
              <span aria-hidden="true" className={styles.socialIcon}>
                <Image
                  alt=""
                  className={`${styles.socialIconImage} ${social.imageClassName}`}
                  height={social.imageHeight}
                  src={social.icon}
                  width={social.imageWidth}
                />
              </span>
              {social.label}
            </a>
          ))}
        </div>
      </div>

      <div className={styles.footerDivider} />

      <div className={styles.footerInfo}>
        <div className={styles.policyLinks}>
          {policies.map((policy) => (
            <a
              className={policy.isStrong ? styles.policyStrong : undefined}
              href={policy.href}
              key={policy.label}
            >
              {policy.label}
            </a>
          ))}
        </div>
        <div className={styles.customerCenter}>
          <p className={styles.customerCenterLabel}>고객센터</p>
          <p>전화번호 : {companyProfile.phone}</p>
          <p>{companyProfile.operatingHours.footerWeekday}</p>
          <p>{companyProfile.operatingHours.footerLunch}</p>
        </div>
      </div>

      <div className={styles.footerDivider} />

      <div className={styles.companyInfo}>
        <p>
          {`${companyProfile.name} | 대표자명 : ${companyProfile.representative} | 사업자 등록번호 : ${companyProfile.businessRegistrationNumber}`}
        </p>
        <p>통신판매 신고번호 : {companyProfile.mailOrderSalesNumber}</p>
        <p>본사 : {companyProfile.address.full}</p>
        <p>일산지사 : {companyProfile.branches.ilsan}</p>
        <p>성수동 출고실(인쇄물) : {companyProfile.productionRooms.seongsu}</p>
        <p>파주 출고실(인쇄물) : {companyProfile.productionRooms.paju}</p>
        <p>오산 출고실(실사) : {companyProfile.productionRooms.osan}</p>
        <p>
          {`개인정보관리책임자 : ${companyProfile.privacyManager.name}(${companyProfile.privacyManager.email})`}
        </p>
        <p className={styles.copyrightText}>
          Copyright ⓒ 2026 C-Brain. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
