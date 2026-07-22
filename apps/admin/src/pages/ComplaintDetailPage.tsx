import {
  createSignedFileUrl,
  getAdminInquiry,
  STORAGE_BUCKETS,
  updateInquiryStatus,
} from '@repo/supabase'
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import '../components/admin-form/AdminFormLayout.css'
import '../components/admin-table/AdminDataTableSection.css'
import { supabase } from '../lib/supabase'
import {
  complaintStatusLabels,
  complaintStatuses,
  isComplaintStatus,
  toComplaintRecord,
} from './complaintData'
import type { ComplaintRecord } from './complaintData'
import './ComplaintDetailPage.css'

type DetailFieldProps = {
  readonly copyable?: boolean
  readonly label: string
  readonly value: string
}

function DetailField({ copyable = false, label, value }: DetailFieldProps) {
  return (
    <div className="complaint-detail__field">
      <dt className="complaint-detail__term pretendard-medium-14">{label}</dt>
      <dd className="complaint-detail__value pretendard-medium-16">
        {copyable ? (
          <span className="complaint-detail__value-with-copy">
            <span className="complaint-detail__value-copy-text">{value}</span>
            <button
              className="complaint-detail__copy-button pretendard-bold-14"
              onClick={() => {
                void navigator.clipboard
                  .writeText(value)
                  .then(() => toast.success('복사되었습니다.'))
                  .catch(() => toast.error('복사하지 못했습니다.'))
              }}
              type="button"
            >
              복사
            </button>
          </span>
        ) : (
          value
        )}
      </dd>
    </div>
  )
}

export function ComplaintDetailPage() {
  const { complaintId } = useParams<{ complaintId: string }>()
  const [complaint, setComplaint] = useState<ComplaintRecord | null>(null)
  const [isLoading, setIsLoading] = useState(Boolean(complaintId))
  const [loadError, setLoadError] = useState('')
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)

  useEffect(() => {
    let isCurrent = true

    async function loadComplaint(id: string) {
      setIsLoading(true)
      setLoadError('')

      try {
        const inquiry = await getAdminInquiry(supabase, id)
        const attachmentResults = await Promise.allSettled(
          (inquiry.inquiry_attachments ?? []).map(async (attachment) => {
            const { signedUrl } = await createSignedFileUrl(
              supabase,
              STORAGE_BUCKETS.privateAttachments,
              attachment.path,
            )

            return [attachment.id, signedUrl] as const
          }),
        )
        const attachmentDownloadUrls = Object.fromEntries(
          attachmentResults.flatMap((result) =>
            result.status === 'fulfilled' ? [result.value] : [],
          ),
        )

        if (isCurrent) {
          setComplaint(toComplaintRecord(inquiry, attachmentDownloadUrls))
          if (attachmentResults.some((result) => result.status === 'rejected')) {
            toast.error('일부 첨부 파일을 불러오지 못했습니다.')
          }
        }
      } catch {
        if (!isCurrent) return
        setLoadError('접수 내역을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.')
        toast.error('접수 내역을 불러오지 못했습니다.')
      } finally {
        if (isCurrent) setIsLoading(false)
      }
    }

    if (complaintId) void loadComplaint(complaintId)

    return () => {
      isCurrent = false
    }
  }, [complaintId])

  async function handleStatusChange(value: string) {
    if (!complaint || !isComplaintStatus(value) || value === complaint.status) return

    setIsUpdatingStatus(true)

    try {
      await updateInquiryStatus(supabase, complaint.id, value)
      setComplaint((current) => (current ? { ...current, status: value } : current))
      toast.success('처리상태를 변경했습니다.')
    } catch {
      toast.error('처리상태를 변경하지 못했습니다.')
      window.alert('처리상태를 변경하지 못했습니다. 다시 시도해주세요.')
    } finally {
      setIsUpdatingStatus(false)
    }
  }

  if (!complaintId || isLoading || !complaint) {
    const errorMessage = complaintId ? loadError : '접수 내역을 찾을 수 없습니다.'

    return (
      <main className="complaint-detail-page" aria-labelledby="complaint-detail-title">
        <section className="complaint-detail complaint-detail--empty">
          <h1
            className="complaint-detail__title pretendard-bold-18"
            id="complaint-detail-title"
          >
            불편접수 상세
          </h1>
          <p
            className="complaint-detail__empty-copy pretendard-medium-16"
            role={errorMessage ? 'alert' : 'status'}
          >
            {errorMessage || '접수 내역을 불러오는 중입니다.'}
          </p>
          <Link
            className="admin-form__button admin-form__button--outline"
            to="/complaints"
          >
            목록으로
          </Link>
        </section>
      </main>
    )
  }

  return (
    <main className="complaint-detail-page" aria-labelledby="complaint-detail-title">
      <article className="complaint-detail">
        <header className="complaint-detail__header">
          <div className="complaint-detail__heading">
            <h1
              className="complaint-detail__title pretendard-bold-18"
              id="complaint-detail-title"
            >
              불편접수 상세
            </h1>
            <span className="admin-data-table__status pretendard-medium-14">
              <span className="admin-data-table__status-dot" />
              <span>{complaintStatusLabels[complaint.status]}</span>
            </span>
          </div>

          <label className="complaint-detail__status-control">
            <span className="pretendard-bold-14">처리상태</span>
            <select
              className="complaint-detail__status-select pretendard-medium-14"
              disabled={isUpdatingStatus}
              onChange={(event) => void handleStatusChange(event.currentTarget.value)}
              value={complaint.status}
            >
              {complaintStatuses.map((status) => (
                <option key={status} value={status}>
                  {complaintStatusLabels[status]}
                </option>
              ))}
            </select>
          </label>
        </header>

        <section
          className="complaint-detail__section"
          aria-labelledby="complaint-intake-title"
        >
          <h2
            className="complaint-detail__section-title pretendard-bold-16"
            id="complaint-intake-title"
          >
            접수 정보
          </h2>
          <dl className="complaint-detail__definition-grid">
            <DetailField label="접수번호" value={complaint.id} />
            <DetailField label="접수일자" value={complaint.createdAt} />
            <DetailField label="이용 서비스" value={complaint.service} />
            <DetailField label="불편 유형" value={complaint.complaintType} />
          </dl>
        </section>

        <section
          className="complaint-detail__section"
          aria-labelledby="complaint-customer-title"
        >
          <h2
            className="complaint-detail__section-title pretendard-bold-16"
            id="complaint-customer-title"
          >
            접수자 정보
          </h2>
          <dl className="complaint-detail__definition-grid">
            <DetailField label="이름" value={complaint.name} />
            <DetailField copyable label="이메일" value={complaint.email} />
            <DetailField copyable label="휴대폰 번호" value={complaint.phone} />
            <DetailField
              label="휴대폰 인증"
              value={complaint.phoneVerified ? '인증 완료' : '미인증'}
            />
            <DetailField label="개인정보 동의" value={complaint.privacyAgreedAt} />
          </dl>
        </section>

        <section
          className="complaint-detail__section"
          aria-labelledby="complaint-content-title"
        >
          <h2
            className="complaint-detail__section-title pretendard-bold-16"
            id="complaint-content-title"
          >
            상세 내용
          </h2>
          <p className="complaint-detail__content pretendard-medium-16">{complaint.detail}</p>
        </section>

        <section
          className="complaint-detail__section"
          aria-labelledby="complaint-attachments-title"
        >
          <h2
            className="complaint-detail__section-title pretendard-bold-16"
            id="complaint-attachments-title"
          >
            첨부 파일
          </h2>
          {complaint.attachments.length > 0 ? (
            <ul className="complaint-detail__attachment-list">
              {complaint.attachments.map((attachment) => (
                <li key={attachment.id}>
                  {attachment.downloadUrl ? (
                    <a
                      className="complaint-detail__attachment"
                      download={attachment.name}
                      href={attachment.downloadUrl}
                    >
                      <span className="complaint-detail__attachment-name pretendard-medium-14">
                        {attachment.name}
                      </span>
                      <span className="complaint-detail__attachment-size pretendard-medium-12">
                        {attachment.sizeLabel}
                      </span>
                    </a>
                  ) : (
                    <div className="complaint-detail__attachment">
                      <span className="complaint-detail__attachment-name pretendard-medium-14">
                        {attachment.name}
                      </span>
                      <span className="complaint-detail__attachment-size pretendard-medium-12">
                        다운로드 불가
                      </span>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="complaint-detail__empty-copy pretendard-medium-14">
              첨부된 파일이 없습니다.
            </p>
          )}
        </section>

        <div className="complaint-detail__bottom-actions">
          <Link
            className="admin-form__button admin-form__button--outline"
            to="/complaints"
          >
            목록으로
          </Link>
        </div>
      </article>
    </main>
  )
}
