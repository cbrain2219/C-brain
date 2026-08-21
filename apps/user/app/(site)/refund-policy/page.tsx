import { JsonLdScript } from "../../_components/JsonLdScript";
import { createPageMetadata } from "../../_content/seo";
import { createStaticPageStructuredData } from "../../_content/structured-data";
import { LegalDocument, LegalTable } from "../_components/LegalDocument";

export const metadata = createPageMetadata("refundPolicy");

export default function RefundPolicyPage() {
  return (
    <>
      <JsonLdScript data={createStaticPageStructuredData("refundPolicy")} />
      <LegalDocument
        description="씨브레인 인쇄·디자인 서비스 취소 및 환불 기준"
        title="취소 및 환불 규정"
      >
        <article>
          <h2>제1조 (목적)</h2>
          <p>
            본 규정은 씨브레인(이하 &quot;회사&quot;)이 제공하는 인쇄·디자인
            서비스의 취소 및 환불 기준을 정하고, 이용자의 권익을 보호함을
            목적으로 합니다.
          </p>
        </article>

        <article>
          <h2>제2조 (취소 규정)</h2>
          <div data-legal-group>
            <p>
              <strong>① 이용자의 취소</strong>
            </p>
            <LegalTable label="이용자의 취소 시점별 환불 조건">
              <thead>
                <tr>
                  <th>취소 시점</th>
                  <th>환불 조건</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>작업 착수 전 취소</td>
                  <td>결제 금액 100% 환불</td>
                </tr>
                <tr>
                  <td>디자이너 배정 후 ~ 교정 진행 중 취소</td>
                  <td>결제 금액에서 인쇄비 및 택배비를 제외한 금액 환불</td>
                </tr>
                <tr>
                  <td>인쇄 진행 후 취소</td>
                  <td>환불 불가</td>
                </tr>
              </tbody>
            </LegalTable>
          </div>
          <div data-legal-group>
            <p>
              <strong>② 회사의 취소</strong>
            </p>
            <ul>
              <li>
                천재지변, 불가항력 사유 등으로 서비스 제공이 불가능한 경우
                회사는 계약을 취소할 수 있습니다.
              </li>
              <li>이 경우 이미 결제된 금액은 전액 환불합니다.</li>
            </ul>
          </div>
        </article>

        <article>
          <h2>제3조 (환불 기준)</h2>
          <div data-legal-group>
            <p>
              <strong>① 회사 귀책사유 환불</strong>
            </p>
            <LegalTable label="회사 귀책사유별 환불 조건">
              <thead>
                <tr>
                  <th>사유</th>
                  <th>환불 조건</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>인쇄 오류 (회사 과실)</td>
                  <td>재작업 또는 전액 환불</td>
                </tr>
                <tr>
                  <td>배송 중 파손 (택배사 과실 포함)</td>
                  <td>재작업 또는 해당 금액 환불</td>
                </tr>
                <tr>
                  <td>납기 지연 (회사 귀책)</td>
                  <td>지연 기간에 따라 협의하여 부분 환불 가능</td>
                </tr>
              </tbody>
            </LegalTable>
          </div>
          <div data-legal-group>
            <p>
              <strong>② 이용자 귀책사유 (환불 불가)</strong>
            </p>
            <ul>
              <li>
                최종 시안 승인 후 이용자 측 오류(오탈자, 색상, 내용 등)로 인한
                불량품
              </li>
              <li>이용자가 제공한 파일·데이터의 오류로 인한 결과물 문제</li>
              <li>
                인쇄물의 특성상 모니터 색상(RGB)과 인쇄 색상(CMYK) 차이, 판별
                습도에 따른 ±10% 오차로 인한 불만
              </li>
              <li>인쇄 완료 후 단순 변심</li>
              <li>특수 색상(Pantone/DIC) 사용 시 사전 협의 없이 진행된 경우</li>
              <li>
                인쇄 불량 발생 시 재인쇄 신청 기한(인쇄 수령 후 7일)을 초과하여
                접수된 경우
              </li>
            </ul>
          </div>
        </article>

        <article>
          <h2>제4조 (파손 상품 처리 절차)</h2>
          <ol>
            <li>
              배송 중 파손된 제품은 수령 후 24시간 이내에 카카오톡
              채널(@씨브레인, 평일 09:00~18:00)로 연락하여야 합니다.
            </li>
            <li>
              파손 상품 사진(제품 외부 박스, 파손 상품 전체 및 부분)을 촬영하여
              카카오톡 채널(@씨브레인, 평일 09:00~18:00)로 송부해 주시기
              바랍니다.
            </li>
            <li>
              <strong>
                박스·송장·인쇄물 원물을 보존한 경우에만 배상이 가능합니다.
              </strong>{" "}
              임의 폐기 시 배상이 제한될 수 있습니다.
            </li>
            <li>사진 확인 후 재작업 또는 환불 여부를 안내해 드립니다.</li>
          </ol>
        </article>

        <article>
          <h2>제5조 (환불 처리 기한)</h2>
          <p>
            환불 결정 후 영업일 기준 <strong>3~5일 이내</strong>에 처리합니다.
          </p>
          <aside data-legal-note="warning">
            ※ 카드 결제의 경우 카드사 사정에 따라 처리 기간이 다소 지연될 수
            있습니다.
          </aside>
        </article>

        <article>
          <h2>제6조 (환불 신청 방법)</h2>
          <div data-legal-group>
            <p>다음 방법 중 하나를 통해 환불을 신청할 수 있습니다.</p>
            <ul>
              <li>카카오톡 채널 : @씨브레인 (평일 09:00~18:00)</li>
            </ul>
          </div>
          <div data-legal-group>
            <p>신청 시 아래 사항을 기재해 주세요.</p>
            <ul>
              <li>거래처명 (담당자 성명)</li>
              <li>주문 내역 (품목, 수량, 결제일)</li>
              <li>환불 사유</li>
              <li>환불 계좌 정보</li>
            </ul>
          </div>
        </article>

        <article>
          <h2>제7조 (분쟁 해결)</h2>
          <p>
            본 규정과 관련하여 분쟁이 발생한 경우 상호 협의하여 해결하는 것을
            원칙으로 하며, 협의가 이루어지지 않는 경우 아래 기관에 문의할 수
            있습니다.
          </p>
          <ul>
            <li>공정거래위원회</li>
            <li>1372 소비자상담센터</li>
          </ul>
        </article>

        <section aria-label="부칙" data-legal-addendum>
          <strong>부칙</strong>
          <p>본 규정은 2025년 1월 1일부터 시행합니다.</p>
          <p>문의 : 카카오톡 채널 @씨브레인 (평일 09:00~18:00)</p>
        </section>
      </LegalDocument>
    </>
  );
}
