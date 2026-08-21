import { JsonLdScript } from "../../_components/JsonLdScript";
import { createPageMetadata } from "../../_content/seo";
import { createStaticPageStructuredData } from "../../_content/structured-data";
import { LegalDocument, LegalTable } from "../_components/LegalDocument";

export const metadata = createPageMetadata("privacyPolicy");

export default function PrivacyPolicyPage() {
  return (
    <>
      <JsonLdScript data={createStaticPageStructuredData("privacyPolicy")} />
      <LegalDocument
        description="시행일: 2025년 1월 1일"
        title="개인정보처리방침"
      >
        <article>
          <h2>제1조 (개인정보처리방침의 목적)</h2>
          <p>
            씨브레인(이하 &quot;회사&quot;)은 「개인정보 보호법」 제30조에 따라
            이용자의 개인정보를 보호하고 이와 관련한 고충을 신속하고 원활하게
            처리할 수 있도록 다음과 같이 개인정보처리방침을 수립·공개합니다.
          </p>
        </article>

        <article>
          <h2>제2조 (개인정보의 수집 항목 및 수집 방법)</h2>
          <p>회사는 서비스 제공을 위해 다음과 같은 개인정보를 수집합니다.</p>
          <LegalTable label="개인정보의 수집 항목 및 수집 방법">
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
                <td>전화·이메일·홈페이지 문의</td>
              </tr>
              <tr>
                <td>세금계산서 발행 시</td>
                <td>사업자등록번호, 상호, 대표자명, 사업장 주소, 이메일</td>
                <td>계약서·발주서 등 서면</td>
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
            ※ 결제 카드 정보는 나이스페이먼츠를 통해 처리되며, 회사는 카드
            정보를 직접 저장하지 않습니다.
          </aside>
        </article>

        <article>
          <h2>제3조 (개인정보의 수집 및 이용 목적)</h2>
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
                <td>대금 결제, 세금계산서·현금영수증 발행, 환불 처리</td>
              </tr>
              <tr>
                <td>배송 처리</td>
                <td>완성 인쇄물 배송</td>
              </tr>
              <tr>
                <td>고객 지원</td>
                <td>문의 접수 및 처리, 분쟁 해결</td>
              </tr>
            </tbody>
          </LegalTable>
        </article>

        <article>
          <h2>제4조 (개인정보의 보유 및 이용 기간)</h2>
          <p>
            이용자의 개인정보는 거래 목적이 달성된 후 지체 없이 파기합니다. 단,
            관련 법령에 따라 일정 기간 보존이 필요한 경우 해당 기간 동안
            보관합니다.
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
          <h2>제5조 (개인정보의 제3자 제공)</h2>
          <ol>
            <li>
              회사는 이용자의 개인정보를 원칙적으로 제3자에게 제공하지 않습니다.
            </li>
            <li>
              단, 다음 각 호의 경우에는 예외로 합니다.
              <ul>
                <li>이용자가 사전에 동의한 경우</li>
                <li>
                  법령에 의거하거나 수사 목적으로 법령에서 정한 절차와 방법에
                  따라 수사기관이 요구하는 경우
                </li>
              </ul>
            </li>
            <li>
              서비스 이행을 위해 아래와 같이 제3자에게 개인정보를 제공합니다.
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
            </li>
          </ol>
        </article>

        <article>
          <h2>제6조 (개인정보 처리의 위탁)</h2>
          <p>
            회사는 현재 개인정보 처리를 외부에 위탁하지 않습니다. 향후 위탁
            계약이 발생할 경우 본 방침을 통해 공개하겠습니다.
          </p>
        </article>

        <article>
          <h2>제7조 (개인정보의 파기)</h2>
          <ol>
            <li>
              회사는 개인정보 보유 기간의 경과, 처리 목적 달성 등 개인정보가
              불필요하게 된 경우 지체 없이 해당 개인정보를 파기합니다.
            </li>
            <li>
              파기 방법은 다음과 같습니다.
              <ul>
                <li>
                  <strong>전자적 파일</strong> : 복구 및 재생이 불가능한
                  방법으로 영구 삭제
                </li>
                <li>
                  <strong>출력물·서면</strong> : 분쇄 또는 소각
                </li>
              </ul>
            </li>
          </ol>
        </article>

        <article>
          <h2>제8조 (이용자의 권리와 행사 방법)</h2>
          <ol>
            <li>
              이용자는 언제든지 자신의 개인정보에 대해 열람, 수정, 삭제, 처리
              정지를 요청할 수 있습니다.
            </li>
            <li>
              권리 행사는 카카오톡 채널(@씨브레인, 평일 09:00~18:00)로 요청할 수
              있습니다.
            </li>
            <li>회사는 요청을 받은 날로부터 10일 이내에 처리합니다.</li>
            <li>
              개인정보의 삭제 또는 처리 정지를 요청하는 경우 서비스 이용이
              제한될 수 있습니다.
            </li>
            <li>
              이용자는 개인정보 침해에 관한 분쟁 해결이나 상담을 위해 아래
              기관에 문의할 수 있습니다.
              <ul>
                <li>개인정보 침해신고센터 : privacy.kisa.or.kr / 118</li>
                <li>개인정보 분쟁조정위원회 : www.kopico.go.kr / 1833-6972</li>
                <li>대검찰청 사이버수사과 : www.spo.go.kr / 1301</li>
                <li>경찰청 사이버수사국 : ecrm.cyber.go.kr / 182</li>
              </ul>
            </li>
          </ol>
        </article>

        <article>
          <h2>제9조 (개인정보의 안전성 확보 조치)</h2>
          <p>
            회사는 개인정보의 안전성 확보를 위해 다음과 같은 조치를 취하고
            있습니다.
          </p>
          <ul>
            <li>개인정보에 대한 접근 권한 최소화 및 관리</li>
            <li>개인정보 접근 기록 보관 및 위·변조 방지</li>
            <li>보안 프로그램 설치 및 주기적 갱신</li>
          </ul>
        </article>

        <article>
          <h2>제10조 (개인정보 보호책임자)</h2>
          <p>
            회사는 개인정보 처리에 관한 업무를 총괄하고, 이용자의 불만 처리 및
            피해 구제를 위해 개인정보 보호책임자를 지정합니다.
          </p>
          <LegalTable label="개인정보 보호책임자 연락처">
            <thead>
              <tr>
                <th>구분</th>
                <th>내용</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>개인정보 보호책임자</td>
                <td>정혜영 (대표)</td>
              </tr>
              <tr>
                <td>연락처</td>
                <td>070-8830-2219</td>
              </tr>
              <tr>
                <td>이메일</td>
                <td>jhy@cbrain.kr</td>
              </tr>
              <tr>
                <td>카카오톡 채널</td>
                <td>@씨브레인 (평일 09:00~18:00)</td>
              </tr>
            </tbody>
          </LegalTable>
        </article>

        <article>
          <h2>제11조 (개인정보처리방침의 변경)</h2>
          <ol>
            <li>본 개인정보처리방침은 시행일로부터 적용됩니다.</li>
            <li>
              내용이 변경되는 경우 시행 7일 전부터 홈페이지(cbrain.kr)에
              공지합니다. 단, 이용자에게 불리한 변경의 경우 30일 전부터
              공지합니다.
            </li>
          </ol>
        </article>

        <section aria-label="부칙" data-legal-addendum>
          <strong>부칙</strong>
          <p>본 개인정보처리방침은 2025년 1월 1일부터 시행합니다.</p>
        </section>
      </LegalDocument>
    </>
  );
}
