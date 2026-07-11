import { Button } from "@repo/ui/button";
import Image from "next/image";
import type { CSSProperties } from "react";

import { Icon } from "../../components/Icon";
import styles from "../page.module.css";

const posts = [
  {
    category: "브로슈어",
    title: "브로슈어 제작 전 반드시 확인해야 할 5가지 체크리스트",
    description:
      "박람회·전시회에 참가하기 전, 브로슈어 제작에서 실패하지 않으려면 이것만은 꼭 확인하세요.",
    date: "2026. 11. 02",
    image: "/figma-assets/blog-brochure.png",
  },
  {
    category: "인쇄 가이드",
    title: "카탈로그 인쇄, 코팅 종류별 차이점과 선택 기준",
    description:
      "유광, 무광, 소프트 터치 코팅. 인쇄물의 완성도를 결정짓는 코팅 선택 가이드입니다.",
    date: "2026. 11. 02",
    image: "/figma-assets/blog-print-guide.png",
  },
  {
    category: "디자인 팁",
    title: "홍보물 디자인 발주 시 자주 하는 실수 TOP 5",
    description:
      "디자인 발주 경험이 없는 담당자를 위해 씨브레인이 정리한 실수 방지 가이드입니다.",
    date: "2026. 11. 02",
    image: "/figma-assets/blog-design-tip.png",
  },
];

const buttonStyle: CSSProperties = {
  width: 164,
  borderRadius: 32,
  borderColor: "#ffffff",
  background: "linear-gradient(90deg, #30bac3 0%, #269aa3 100%)",
  color: "#fefefe",
};

export function BlogSection() {
  return (
    <section className={styles.section} id="blog">
      <div className={styles.sectionInner}>
        <div className={styles.sectionHeader}>
          <p className={styles.sectionKicker}>블로그</p>
          <h2 className={styles.sectionTitle}>
            26년 현장에서 검증된 홍보물 제작 · 디자인 · 인쇄 가이드
          </h2>
          <p className={styles.sectionDescription}>
            26년 경력 전문가 씨브레인이 직접 작성하는 브로슈어 · 카탈로그 ·
            인쇄물 제작 실전 정보
          </p>
        </div>

        <div className={styles.blogGrid}>
          {posts.map((post) => (
            <article className={styles.blogCard} key={post.title}>
              <div className={styles.blogImage}>
                <Image
                  alt=""
                  className={styles.coverImage}
                  fill
                  sizes="(min-width: 1440px) 440px, (min-width: 1080px) 33vw, (min-width: 640px) 400px, 350px"
                  src={post.image}
                />
              </div>
              <div className={styles.blogCardBody}>
                <div className={styles.blogCopy}>
                  <p className={styles.blogCategory}>{post.category}</p>
                  <h3>{post.title}</h3>
                  <p>{post.description}</p>
                </div>
                <time>{post.date}</time>
              </div>
            </article>
          ))}
        </div>

        <div className={styles.centerAction}>
          <Button
            rightIcon={<Icon name="arrow-right" size={16} />}
            style={buttonStyle}
          >
            블로그 전체 보기
          </Button>
        </div>
      </div>
    </section>
  );
}
