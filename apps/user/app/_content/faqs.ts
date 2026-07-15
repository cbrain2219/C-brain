export type FaqItem = {
  answer: string;
  question: string;
};

export type FaqCategory = {
  icon: string;
  id: string;
  items: readonly FaqItem[];
  title: string;
};

const orderPaymentFaqs = [
  {
    question: "소량 주문도 가능한가요?",
    answer:
      "씨브레인은 소량 주문도 진행이 가능합니다. 제품 사양에 따라 최소 주문 수량이 상이할 수 있으니, 카카오톡 1:1 상담으로 문의 주시면 정확한 최소 수량을 안내해 드립니다.",
  },
  {
    question: "견적은 어떻게 받나요?",
    answer:
      "카카오톡 1:1 상담으로 제품 종류·수량·사양·납기를 알려주시면 빠르게 견적을 드립니다. 홈페이지 견적 폼으로도 요청하실 수 있습니다.",
  },
  {
    question: "주문은 어떤 순서로 진행되나요?",
    answer:
      "상담으로 제작 사양을 정리한 뒤 견적을 안내하고, 결제와 자료 전달이 완료되면 디자인·검수·인쇄·납품 순서로 진행됩니다.",
  },
  {
    question: "결제는 언제 하나요?",
    answer:
      "일반적으로 견적 확정 후 제작 착수 전에 결제를 진행합니다. 기관·기업 거래처럼 내부 결재 절차가 필요한 경우 상담 시 일정을 함께 조율합니다.",
  },
  {
    question: "세금계산서나 현금영수증 발행이 가능한가요?",
    answer:
      "사업자등록증과 발행 정보를 전달해 주시면 세금계산서 발행이 가능합니다. 개인 결제 건은 요청 시 현금영수증 발행을 도와드립니다.",
  },
  {
    question: "급한 일정도 접수할 수 있나요?",
    answer:
      "가능 여부는 품목·수량·후가공·배송지에 따라 달라집니다. 희망 납기와 제작 사양을 먼저 알려주시면 가능한 진행 방법을 빠르게 확인해 드립니다.",
  },
] as const satisfies readonly FaqItem[];

const deliveryFaqs = [
  {
    question: "성남 외 지역도 납품 가능한가요?",
    answer:
      "씨브레인에서 제작하는 모든 홍보물은 전국 어디든 안전하게 납품이 가능합니다. 여러 지점으로 분할 발송도 지원하오니, 필요하신 경우 카카오톡 1:1 상담으로 문의해 주세요.",
  },
  {
    question: "제작 기간(납기)은 얼마나 걸리나요?",
    answer:
      "기본 명함은 영업일 기준 1~2일, 브로슈어·리플렛 소량은 3~5일, 대량(1,000부 이상)은 5~7일입니다. 후가공이 추가되면 일정이 달라질 수 있으니 카카오톡으로 문의 주세요.",
  },
  {
    question: "여러 장소로 나누어 배송할 수 있나요?",
    answer:
      "지점·부서·행사장 등 여러 배송지로 분할 납품이 가능합니다. 배송지 목록과 수량 배분표를 주시면 포장 단위까지 맞춰 안내해 드립니다.",
  },
  {
    question: "직접 방문 수령도 가능한가요?",
    answer:
      "품목과 제작 일정에 따라 방문 수령이 가능한 경우가 있습니다. 수령 가능 시간과 장소는 제작 완료 시점에 맞춰 별도로 안내해 드립니다.",
  },
  {
    question: "납품 일정은 어떻게 확정되나요?",
    answer:
      "디자인 확정, 결제, 인쇄 사양 확정이 완료된 시점을 기준으로 제작 일정이 확정됩니다. 행사일처럼 고정 일정이 있다면 상담 초기에 알려주세요.",
  },
] as const satisfies readonly FaqItem[];

const fileDesignFaqs = [
  {
    question: "기획 · 디자인 · 인쇄를 한 곳에서 맡기면 뭐가 좋나요?",
    answer:
      "씨브레인은 기획부터 디자인·인쇄·납품까지 한 곳에서 원스톱으로 처리합니다. 별도 디자인 에이전시와 인쇄소를 각각 섭외할 필요가 없어 시간·비용·소통 비용이 모두 절감됩니다. 1:1 전담 디자이너가 처음부터 끝까지 책임 진행합니다.",
  },
  {
    question: "디자인 파일이 없어도 제작할 수 있나요?",
    answer:
      "가능합니다. 필요한 문구, 로고, 참고 이미지, 원하는 분위기를 전달해 주시면 전담 디자이너가 제작 목적에 맞춰 디자인을 구성합니다.",
  },
  {
    question: "보유한 로고나 사진을 사용할 수 있나요?",
    answer:
      "사용 가능합니다. 다만 인쇄 품질을 위해 원본 로고 파일이나 고해상도 이미지를 권장합니다. 파일 상태가 낮으면 대체 방법을 함께 제안드립니다.",
  },
  {
    question: "수정은 몇 번까지 가능한가요?",
    answer:
      "기본 수정 범위는 제작 품목과 견적에 따라 안내됩니다. 오탈자나 간단한 정보 수정은 빠르게 반영하고, 방향이 크게 바뀌는 수정은 추가 일정이 필요할 수 있습니다.",
  },
  {
    question: "인쇄용 파일 형식은 무엇이 필요한가요?",
    answer:
      "AI, PDF, PSD 등 원본 편집 파일이 가장 좋습니다. 이미지 파일만 있는 경우에도 상태를 확인한 뒤 인쇄 가능 여부와 보완 방법을 안내해 드립니다.",
  },
] as const satisfies readonly FaqItem[];

const printMaterialFaqs = [
  {
    question: "어떤 홍보물을 제작할 수 있나요?",
    answer:
      "명함, 리플렛, 브로슈어, 포스터, 배너, 스티커, 봉투, 패키지 등 기업 홍보와 행사 운영에 필요한 다양한 인쇄물을 제작합니다.",
  },
  {
    question: "종이나 후가공은 추천받을 수 있나요?",
    answer:
      "가능합니다. 예산, 사용 목적, 배포 방식에 따라 적합한 용지와 코팅, 박, 형압, 접지 같은 후가공 옵션을 함께 제안드립니다.",
  },
  {
    question: "실물 색상은 화면과 다를 수 있나요?",
    answer:
      "모니터 화면과 인쇄물은 색을 표현하는 방식이 달라 실제 색상에 차이가 생길 수 있습니다. 중요한 색상은 사전에 기준 색상이나 샘플을 함께 확인하는 것을 권장합니다.",
  },
  {
    question: "샘플 확인이 가능한가요?",
    answer:
      "일부 품목은 기존 제작 샘플이나 유사 용지 샘플 확인이 가능합니다. 별도 샘플 제작이 필요한 경우 비용과 일정이 추가될 수 있습니다.",
  },
  {
    question: "대량 제작 전에 사양을 조정할 수 있나요?",
    answer:
      "인쇄 전 최종 확정 단계에서는 수량, 용지, 후가공, 납품 방식 등을 다시 확인합니다. 제작 착수 후에는 변경 가능 범위가 제한될 수 있습니다.",
  },
] as const satisfies readonly FaqItem[];

const refundCancelFaqs = [
  {
    question: "주문 취소는 언제까지 가능한가요?",
    answer:
      "디자인 또는 인쇄 제작이 시작되기 전에는 취소 가능 여부를 확인할 수 있습니다. 제작 착수 이후에는 진행 단계에 따라 취소 비용이 발생할 수 있습니다.",
  },
  {
    question: "디자인 확정 후에도 환불이 가능한가요?",
    answer:
      "디자인 확정 후 인쇄가 시작되면 단순 변심 환불은 어렵습니다. 제작 단계와 실제 발생 비용을 기준으로 가능 범위를 안내해 드립니다.",
  },
  {
    question: "제작물에 문제가 있으면 어떻게 하나요?",
    answer:
      "수령 후 문제가 확인되면 사진과 함께 상담 채널로 알려주세요. 파일 확정 내용, 인쇄 상태, 배송 상태를 확인한 뒤 재제작 또는 보완 방법을 안내합니다.",
  },
  {
    question: "수량이나 사양 변경은 언제까지 가능한가요?",
    answer:
      "견적 확정 전에는 자유롭게 조정할 수 있고, 제작 착수 전까지는 가능 여부를 확인해 드립니다. 인쇄가 시작된 뒤에는 변경이 어려울 수 있습니다.",
  },
  {
    question: "배송 중 파손은 어떻게 처리되나요?",
    answer:
      "배송 중 파손이 의심되면 포장 상태와 제품 사진을 남겨 상담 채널로 보내주세요. 확인 후 택배사 접수와 재발송 가능 여부를 안내해 드립니다.",
  },
] as const satisfies readonly FaqItem[];

const companyFaqs = [
  {
    question: "씨브레인은 어떤 회사인가요?",
    answer:
      "씨브레인은 홍보물 기획, 디자인, 인쇄, 납품을 한 번에 진행하는 편집디자인·인쇄 제작 전문 회사입니다.",
  },
  {
    question: "전담 디자이너와 직접 소통하나요?",
    answer:
      "네. 프로젝트별 전담 디자이너가 배정되어 제작 목적, 수정 방향, 일정 등을 직접 소통하며 진행합니다.",
  },
  {
    question: "기업·기관 거래도 가능한가요?",
    answer:
      "가능합니다. 기업, 공공기관, 병원, 학교, 협회 등 다양한 조직의 홍보물 제작 경험이 있으며 필요한 증빙 서류도 안내해 드립니다.",
  },
  {
    question: "정기 제작물도 맡길 수 있나요?",
    answer:
      "월간 행사물, 시즌별 브로슈어, 정기 소식지처럼 반복 제작이 필요한 홍보물도 진행 가능합니다. 기존 사양을 기준으로 재주문 흐름을 간소화할 수 있습니다.",
  },
  {
    question: "상담 가능 시간은 언제인가요?",
    answer:
      "평일 오전 9시부터 오후 6시까지 상담이 가능합니다. 점심시간과 주말·공휴일에는 답변이 늦어질 수 있습니다.",
  },
] as const satisfies readonly FaqItem[];

export const faqCategories = [
  {
    id: "order-payment",
    icon: "📦",
    title: "주문·결제",
    items: orderPaymentFaqs,
  },
  {
    id: "delivery",
    icon: "🚚",
    title: "납기·배송",
    items: deliveryFaqs,
  },
  {
    id: "file-design",
    icon: "🖨️",
    title: "파일·디자인",
    items: fileDesignFaqs,
  },
  {
    id: "print-material",
    icon: "📄",
    title: "인쇄·소재",
    items: printMaterialFaqs,
  },
  {
    id: "refund-cancel",
    icon: "🔄",
    title: "환불·취소",
    items: refundCancelFaqs,
  },
  {
    id: "company",
    icon: "🏢",
    title: "회사 정보",
    items: companyFaqs,
  },
] as const satisfies readonly FaqCategory[];

export const landingFaqs = [
  deliveryFaqs[0],
  orderPaymentFaqs[0],
  fileDesignFaqs[0],
  deliveryFaqs[1],
  orderPaymentFaqs[1],
] as const satisfies readonly FaqItem[];
