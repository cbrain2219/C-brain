import type { BlogPost, BlogPostDetail } from "../_types/blog";

type BlogPostSeed = Omit<BlogPost, "detail" | "publishedAtIso" | "slug"> & {
  detail?: BlogPostDetail;
  publishedAtIso?: string;
  slug?: string;
};

export type BlogDetailSeo = {
  description: string;
  keywords: string[];
  title: string;
};

const defaultBlogKeywords = [
  "씨브레인",
  "홍보물 제작",
  "브로슈어 제작",
  "카탈로그 제작",
  "인쇄 실무",
] as const;

const featuredPostDetail: BlogPostDetail = {
  body: [
    {
      id: "intro",
      text: "안녕하세요, 씨브레인입니다. 사용자분들께 더 나은 경험을 제공하기 위해 브로슈어 제작 전 반드시 확인해야 할 체크리스트를 정리했습니다.",
      type: "paragraph",
    },
    {
      id: "purpose",
      text: "이번 글에서는 박람회와 전시회에 참가하기 전, 브로슈어 제작에서 실패하지 않으려면 어떤 기준을 먼저 확인해야 하는지 살펴봅니다.",
      type: "paragraph",
    },
    {
      id: "detail-guide",
      text: "상세 내용은 아래를 확인해 주세요.",
      type: "paragraph",
    },
    {
      alt: "브로슈어 제작 체크리스트 설명 이미지",
      id: "desktop-image-placeholder",
      label: "IMG",
      type: "image",
      visibleOn: "desktop",
    },
    {
      id: "checklist-heading",
      text: "[주요 체크리스트]",
      type: "heading",
    },
    {
      id: "goal-title",
      items: ["제작 목적과 사용 장소를 먼저 정리하세요."],
      start: 1,
      type: "orderedList",
    },
    {
      id: "goal-body",
      items: [
        "전시회 배포용인지, 영업 상담용인지에 따라 분량과 메시지 구조가 달라집니다.",
        "목적이 정리되면 표지, 목차, 본문 흐름을 훨씬 빠르게 결정할 수 있습니다.",
      ],
      type: "unorderedList",
    },
    {
      id: "copy-title",
      items: ["원고와 이미지를 제작 전에 점검하세요."],
      start: 2,
      type: "orderedList",
    },
    {
      id: "copy-body",
      items: [
        "회사 소개, 제품 설명, 인증 자료, 문의처처럼 꼭 필요한 내용을 빠짐없이 모아두세요.",
        "해상도가 낮은 이미지는 인쇄 품질이 떨어질 수 있어 원본 파일을 준비하는 것이 좋습니다.",
      ],
      type: "unorderedList",
    },
    {
      id: "print-title",
      items: ["인쇄 사양과 납품 일정을 함께 확인하세요."],
      start: 3,
      type: "orderedList",
    },
    {
      id: "print-body",
      items: [
        "종이, 후가공, 수량, 납기까지 함께 결정해야 실제 제작 일정이 안정적으로 잡힙니다.",
        "행사 일정이 정해져 있다면 교정과 인쇄 시간을 넉넉히 확보해 주세요.",
      ],
      type: "unorderedList",
    },
    {
      id: "closing",
      text: "씨브레인은 원고 정리부터 디자인, 인쇄, 납품까지 한 번에 진행해 담당자의 시행착오를 줄여드립니다.",
      type: "paragraph",
    },
    {
      id: "thanks",
      text: "감사합니다.",
      type: "paragraph",
    },
  ],
  keywords: [
    ...defaultBlogKeywords,
    "브로슈어 체크리스트",
    "전시회 홍보물",
  ],
  seoDescription:
    "박람회와 전시회를 앞두고 브로슈어 제작 전 반드시 확인해야 할 목적, 원고, 이미지, 인쇄 사양 체크리스트를 확인하세요.",
};

function toPublishedAtIso(publishedAt: string) {
  const [year = "2026", month = "01", day = "01"] = publishedAt
    .split(".")
    .map((part) => part.trim())
    .filter(Boolean);

  return `${year}-${month.padStart(2, "0")}-${day.padStart(
    2,
    "0",
  )}T00:00:00+09:00`;
}

function createDefaultDetail(post: BlogPostSeed): BlogPostDetail {
  return {
    body: [
      {
        id: "intro",
        text: post.summary,
        type: "paragraph",
      },
      {
        id: "point-heading",
        text: "제작 전에 확인할 핵심 포인트",
        type: "heading",
      },
      {
        id: "point-list",
        items: [
          "홍보물의 목적과 독자를 먼저 정리합니다.",
          "원고, 이미지, 로고처럼 제작에 필요한 자료를 한곳에 모읍니다.",
          "인쇄 방식과 납품 일정을 함께 확인해 제작 리스크를 줄입니다.",
        ],
        type: "unorderedList",
      },
      {
        id: "closing",
        text: "씨브레인은 디자인과 인쇄 과정을 함께 검토해 실무자가 바로 활용할 수 있는 제작물을 완성합니다.",
        type: "paragraph",
      },
    ],
    keywords: [...defaultBlogKeywords, post.category, post.title],
    seoDescription: post.summary,
  };
}

function createBlogPost(post: BlogPostSeed): BlogPost {
  return {
    ...post,
    detail: post.detail ?? createDefaultDetail(post),
    publishedAtIso: post.publishedAtIso ?? toPublishedAtIso(post.publishedAt),
    slug: post.slug ?? post.id,
  };
}

export const blogPosts = [
  createBlogPost({
    id: "brochure-production-checklist",
    category: "브로슈어·카탈로그",
    title: "브로슈어 제작 전 반드시 확인해야 할 5가지 체크리스트",
    summary:
      "박람회와 전시회에 참가하기 전, 브로슈어 제작에서 실패하지 않으려면 이것만은 꼭 확인하세요.",
    publishedAt: "2026. 11. 02",
    author: "씨브레인",
    image: "/figma-assets/blog-featured.png",
    landingRank: 1,
    bannerRank: 1,
    popularRank: 1,
    detail: featuredPostDetail,
  }),
  createBlogPost({
    id: "catalog-coating-guide",
    category: "인쇄 실무팁",
    title: "카탈로그 인쇄, 코팅 종류별 차이점과 선택 기준",
    summary:
      "유광, 무광, 소프트 터치 코팅. 인쇄물의 완성도를 결정짓는 코팅 선택 가이드입니다.",
    publishedAt: "2026. 10. 28",
    author: "씨브레인",
    image: "/figma-assets/blog-brochure.png",
    landingRank: 2,
    bannerRank: 2,
    popularRank: 2,
  }),
  createBlogPost({
    id: "leaflet-message-order",
    category: "리플렛·팜플렛",
    title: "한 장의 리플렛에 꼭 담아야 할 핵심 메시지 구성법",
    summary:
      "짧은 시간 안에 읽히는 리플렛은 정보의 우선순위부터 다릅니다. 메시지 구조를 정리해 보세요.",
    publishedAt: "2026. 10. 21",
    author: "씨브레인",
    image: "/figma-assets/blog-print-guide.png",
    landingRank: 3,
    popularRank: 3,
  }),
  createBlogPost({
    id: "design-request-mistakes",
    category: "디자인 실무팁",
    title: "홍보물 디자인 발주 시 자주 하는 실수 TOP 5",
    summary:
      "디자인 발주 경험이 없는 담당자를 위해 씨브레인이 정리한 실수 방지 가이드입니다.",
    publishedAt: "2026. 10. 15",
    author: "씨브레인",
    image: "/figma-assets/blog-brochure.png",
    popularRank: 4,
  }),
  createBlogPost({
    id: "print-paper-selection",
    category: "인쇄 실무팁",
    title: "홍보물 인쇄용지, 목적에 맞게 고르는 방법",
    summary:
      "종이의 두께와 질감, 색상은 인쇄물의 첫인상을 바꿉니다. 용도별 선택 기준을 알려드립니다.",
    publishedAt: "2026. 10. 08",
    author: "씨브레인",
    image: "/figma-assets/blog-print-guide.png",
    popularRank: 5,
  }),
  createBlogPost({
    id: "catalog-page-flow",
    category: "브로슈어·카탈로그",
    title: "카탈로그 페이지 구성, 처음부터 끝까지 읽히게 만드는 순서",
    summary:
      "기업과 제품의 강점을 자연스럽게 전달하는 카탈로그 페이지 흐름을 실제 제작 기준으로 살펴봅니다.",
    publishedAt: "2026. 09. 30",
    author: "씨브레인",
    image: "/figma-assets/blog-brochure.png",
  }),
  createBlogPost({
    id: "pamphlet-size-guide",
    category: "리플렛·팜플렛",
    title: "팜플렛 규격 선택 전 알아두면 좋은 접지 방식",
    summary:
      "2단, 3단, 대문 접지까지. 전달할 정보량과 배포 환경에 맞는 접지 방식을 비교해 보세요.",
    publishedAt: "2026. 09. 23",
    author: "씨브레인",
    image: "/figma-assets/blog-print-guide.png",
  }),
  createBlogPost({
    id: "brand-color-printing",
    category: "디자인 실무팁",
    title: "브랜드 컬러가 인쇄물에서 다르게 보이는 이유",
    summary:
      "화면의 RGB와 인쇄의 CMYK 차이를 이해하면 브랜드 컬러의 오차를 줄일 수 있습니다.",
    publishedAt: "2026. 09. 16",
    author: "씨브레인",
    image: "/figma-assets/blog-brochure.png",
  }),
] satisfies readonly BlogPost[];

export function getBlogPostBySlug(slug: string): BlogPost | undefined {
  return blogPosts.find((post) => post.slug === slug);
}

export function getRelatedBlogPosts(
  currentSlug: string,
  limit = 3,
): BlogPost[] {
  const currentPost = getBlogPostBySlug(currentSlug);
  const sameCategoryPosts = currentPost
    ? blogPosts.filter(
        (post) =>
          post.slug !== currentSlug && post.category === currentPost.category,
      )
    : [];
  const fallbackPosts = blogPosts.filter(
    (post) =>
      post.slug !== currentSlug &&
      !sameCategoryPosts.some((relatedPost) => relatedPost.slug === post.slug),
  );
  const relatedBlogPosts = [...sameCategoryPosts, ...fallbackPosts];

  return relatedBlogPosts.slice(0, limit);
}

export function getBlogDetailSeo(post: BlogPost): BlogDetailSeo {
  return {
    description: post.detail.seoDescription,
    keywords: [...post.detail.keywords],
    title: `${post.title} | C-Brain Blog`,
  };
}
