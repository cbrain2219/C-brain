import { JsonLdScript } from "../../_components/JsonLdScript";
import { createPageMetadata } from "../../_content/seo";
import { createStaticPageStructuredData } from "../../_content/structured-data";
import { LegalDocument, LegalTable } from "../_components/LegalDocument";

export const metadata = createPageMetadata("privacyCollection");

export default function PrivacyCollectionPage() {
  return (
    <>
      <JsonLdScript
        data={createStaticPageStructuredData("privacyCollection")}
      />
      <LegalDocument
        description="씨브레인은 서비스 제공을 위해 아래와 같이 개인정보를 수집·이용합니다. 내용을 확인하신 후 동의 여부를 결정해 주시기 바랍니다."
        title="개인정보 수집 및 이용 동의"
      >
        <article>
          <h2>제1조 (수집하는 개인정보 항목)</h2>
          <p>
            씨브레인은 서비스 제공을 위해 다음과 같은 개인정보를 수집합니다.
          </p>
          <LegalTable label="수집하는 개인정보 항목">
            <thead>
              <tr>
                <th>구분</th>
                <th>수집 항목</th>
                <th>수집 방법</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>주문·거래 시</td>
                <td>상호(성명), 담당자명, 연락처, 이메일, 배송지 주소</td>
                <td>카카오톡 채널·홈페이지 문의 직접 수집</td>
              </tr>
              <tr>
                <td>세금계산서 발행 시</td>
                <td>사업자등록번호, 상호, 대표자명, 사업장 주소, 이메일</td>
                <td>계약서·발주서 등 서면 수집</td>
              </tr>
              <tr>
                <td>결제 시</td>
                <td>결제 수단 정보(카드사, 승인번호 등)</td>
                <td>나이스페이먼츠 결제 모듈</td>
              </tr>
              <tr>
                <td>배송 시</td>
                <td>수령인 성명, 연락처, 배송지 주소</td>
                <td>주문 접수 시 직접 수집</td>
              </tr>
              <tr>
                <td>고객 문의 시</td>
                <td>성명, 연락처, 이메일, 문의 내용</td>
                <td>카카오톡 채널·홈페이지 문의</td>
              </tr>
            </tbody>
          </LegalTable>
          <aside data-legal-note="info">
            ※ 결제 카드 정보는 나이스페이먼츠를 통해 처리되며, 씨브레인은 카드
            정보를 직접 저장하지 않습니다.
          </aside>
        </article>

        <article>
          <h2>제2조 (개인정보의 수집 및 이용 목적)</h2>
          <p>씨브레인은 수집한 개인정보를 다음 목적으로만 이용합니다.</p>
          <LegalTable label="개인정보의 수집 및 이용 목적">
            <thead>
              <tr>
                <th>이용 목적</th>
                <th>상세 내용</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>서비스 제공</td>
                <td>인쇄물 디자인·제작·배송 서비스 이행</td>
              </tr>
              <tr>
                <td>주문·계약 관리</td>
                <td>견적 안내, 주문 접수, 계약 이행, 납기 확인</td>
              </tr>
              <tr>
                <td>결제 및 세금계산서 처리</td>
                <td>대금 결제, 환불 처리, 세금계산서·현금영수증 발행</td>
              </tr>
              <tr>
                <td>배송 처리</td>
                <td>완성 인쇄물 배송(로젠택배·롯데택배 제공)</td>
              </tr>
              <tr>
                <td>고객 지원</td>
                <td>문의 접수 및 처리, 분쟁 해결</td>
              </tr>
            </tbody>
          </LegalTable>
        </article>

        <article>
          <h2>제3조 (개인정보의 보유 및 이용 기간)</h2>
          <p>
            이용자의 개인정보는 거래 목적 달성 후 지체 없이 파기합니다. 단, 관련
            법령에 따라 일정 기간 보존이 필요한 경우 해당 기간 동안 보관합니다.
          </p>
          <LegalTable label="개인정보 보존 근거와 기간">
            <thead>
              <tr>
                <th>보존 근거</th>
                <th>보존 기간</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>전자상거래법 — 계약·청약 철회 기록</td>
                <td>5년</td>
              </tr>
              <tr>
                <td>전자상거래법 — 대금 결제 및 재화 공급 기록</td>
                <td>5년</td>
              </tr>
              <tr>
                <td>전자상거래법 — 소비자 불만·분쟁 처리 기록</td>
                <td>3년</td>
              </tr>
              <tr>
                <td>국세기본법 — 세금계산서 발행 기록</td>
                <td>5년</td>
              </tr>
            </tbody>
          </LegalTable>
        </article>

        <article>
          <h2>제4조 (개인정보의 제3자 제공)</h2>
          <p>
            씨브레인은 서비스 이행을 위해 아래와 같이 이용자의 개인정보를
            제3자에게 제공합니다.
          </p>
          <LegalTable label="개인정보를 제공받는 제3자">
            <thead>
              <tr>
                <th>제공받는 자</th>
                <th>제공 목적</th>
                <th>제공 항목</th>
                <th>보유 기간</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>로젠택배 / 롯데택배</td>
                <td>인쇄물 배송</td>
                <td>수령인 성명, 연락처, 배송지 주소</td>
                <td>배송 완료 후 즉시 파기</td>
              </tr>
              <tr>
                <td>나이스페이먼츠(주)</td>
                <td>결제 처리</td>
                <td>주문 정보, 결제 수단 정보</td>
                <td>결제 완료 후 5년</td>
              </tr>
            </tbody>
          </LegalTable>
        </article>

        <article>
          <h2>제5조 (이용자의 권리)</h2>
          <ol>
            <li>
              이용자는 언제든지 자신의 개인정보에 대해 열람, 수정, 삭제, 처리
              정지를 요청할 수 있습니다.
            </li>
            <li>
              권리 행사는 카카오톡 채널(@씨브레인, 평일 09:00~18:00)로 요청할 수
              있습니다.
            </li>
            <li>씨브레인은 요청을 받은 날로부터 10일 이내에 처리합니다.</li>
            <li>
              개인정보의 삭제 또는 처리 정지를 요청하는 경우 서비스 이용이
              제한될 수 있습니다.
            </li>
          </ol>
        </article>

        <article>
          <h2>제6조 (동의 거부 권리 및 불이익)</h2>
          <p>
            이용자는 개인정보 수집 및 이용에 대한 동의를 거부할 권리가 있습니다.
          </p>
          <aside data-legal-note="warning">
            ※ 필수 항목에 대한 동의를 거부하는 경우 서비스
            이용(주문·계약·배송)이 불가합니다.
          </aside>
        </article>

        <section aria-label="부칙" data-legal-addendum>
          <strong>부칙</strong>
          <p>본 동의서는 2025년 1월 1일부터 시행합니다.</p>
        </section>
      </LegalDocument>
    </>
  );
}
