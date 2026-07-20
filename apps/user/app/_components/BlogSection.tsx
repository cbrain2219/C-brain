import { Button } from "@repo/ui/button";

import { Icon } from "../../components/Icon";
import { SectionLayout } from "../../components/SectionLayout";
import styles from "../page.module.css";
import { createGradientBorderButtonStyle } from "./buttonStyles";

const buttonStyle = createGradientBorderButtonStyle();

export function BlogSection() {
  return (
    <SectionLayout
      badge="블로그"
      badgeClassName={styles.blogKicker}
      className={styles.blogSection}
      description="26년 경력 전문가 씨브레인이 직접 작성하는 브로슈어 · 카탈로그 · 인쇄물 제작 실전 정보"
      descriptionClassName={styles.blogDescription}
      id="blog"
      innerClassName={styles.blogInner}
      title={
        <>
          <span>26년 현장에서 검증된</span>
          <span>홍보물 제작 · 디자인 · 인쇄 가이드</span>
        </>
      }
      titleClassName={styles.blogTitle}
    >
      <div className={styles.centerAction}>
        <Button
          rightIcon={<Icon name="arrow-right" size={16} />}
          style={buttonStyle}
        >
          블로그 전체 보기
        </Button>
      </div>
    </SectionLayout>
  );
}
