import styles from "./page.module.css";

const imgMessageTyping = "/figma-assets/message-typing.svg";
const imgEdit03 = "/figma-assets/edit-03.svg";
const imgChevronDown = "/figma-assets/chevron-down.svg";
const imgLogoMark = "/figma-assets/logo-mark.svg";
const imgLogoType = "/figma-assets/logo-type.svg";

const navItems = ["About", "Service", "Blog", "Portfolio", "FAQ"];

export default function Home() {
  return (
    <main className={styles.page}>
      <header className={styles.header} data-node-id="269:32520">
        <div className={styles.left}>
          <a className={styles.logo} href="/" aria-label="ZeroSourcing home">
            <img className={styles.logoMark} src={imgLogoMark} alt="" />
            <img className={styles.logoType} src={imgLogoType} alt="zeroSourcing" />
          </a>

          <nav className={styles.nav} aria-label="Primary navigation">
            {navItems.map((item) => (
              <a
                key={item}
                className={item === "About" ? styles.activeNavLink : styles.navLink}
                href="/"
              >
                {item}
                {item === "Service" ? (
                  <img className={styles.chevron} src={imgChevronDown} alt="" />
                ) : null}
              </a>
            ))}
          </nav>
        </div>

        <div className={styles.actions}>
          <a className={styles.outsourceButton} href="/">
            <img src={imgEdit03} alt="" />
            외주 문의하기
          </a>
          <a className={styles.quickButton} href="/">
            <img src={imgMessageTyping} alt="" />
            간편 문의하기
          </a>
        </div>
      </header>
    </main>
  );
}
