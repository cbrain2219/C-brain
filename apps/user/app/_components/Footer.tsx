import Image from "next/image";

import styles from "../page.module.css";

const socials = ["인스타그램", "네이버 블로그", "유튜브"];
const policies = ["이용약관", "개인정보처리방침", "취소 및 환불 규정"];

export function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.footerTop}>
        <a aria-label="씨브레인 홈" className={styles.footerLogo} href="#">
          <Image
            alt=""
            height={21}
            src="/figma-assets/cbrain-logo-main.svg"
            width={77}
          />
          <Image
            alt=""
            height={4}
            src="/figma-assets/cbrain-logo-tagline.svg"
            width={76}
          />
        </a>
        <div className={styles.socialLinks}>
          {socials.map((social) => (
            <a href="#" key={social}>
              <span aria-hidden="true" />
              {social}
            </a>
          ))}
        </div>
      </div>

      <div className={styles.footerDivider} />

      <div className={styles.footerInfo}>
        <div className={styles.policyLinks}>
          {policies.map((policy) => (
            <a href="#" key={policy}>
              {policy}
            </a>
          ))}
        </div>
        <div className={styles.customerCenter}>
          <strong>고객센터</strong>
          <p>전화번호 : 010-3242-8118</p>
          <p>주중 09~18시 (점심시간 12~13시 30분 / 주말 및 공휴일 제외)</p>
        </div>
      </div>

      <div className={styles.footerDivider} />

      <div className={styles.companyInfo}>
        <p>씨브레인 | 사업자등록번호 : 000-00-00000 | 대표 : 홍길동</p>
        <p>개인정보처리담당자 : 홍길동</p>
        <p>
          주소 : 경기도 고양시 덕양구 동축로70, A동 9층 901호(동산동,
          현대프리미어캠퍼스)
        </p>
        <p>통신판매업신고번호 : 고양-0000-0000</p>
        <p>메일 : contact@zerofee.kr</p>
        <p>Copyright ⓒ 2026 C-Brain. All rights reserved.</p>
      </div>
    </footer>
  );
}
