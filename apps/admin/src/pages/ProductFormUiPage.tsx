import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { AdminFooter } from '../components/AdminFooter'
import { AdminFormLayout } from '../components/admin-form/AdminFormLayout'
import { ProductFormFields } from './ProductFormFields'
import { createProductUiDraft } from './productFormUi'
import type { ProductUiDraft } from './productFormUi'

function createInitialUiDraft(): ProductUiDraft {
  return createProductUiDraft('브로슈어 · 카탈로그')
}

export function ProductFormUiPage() {
  const { productId } = useParams<{ productId: string }>()
  const [draft, setDraft] = useState(createInitialUiDraft)
  const isEditing = productId !== undefined

  return (
    <>
      <AdminFormLayout
        actions={
          <>
            <Link
              className="admin-form__button admin-form__button--outline"
              to="/products"
            >
              목록으로
            </Link>
            <div className="admin-form__actions-group">
              <button
                className="admin-form__button admin-form__button--outline"
                name="intent"
                type="submit"
                value="draft"
              >
                임시저장
              </button>
              <button
                className="admin-form__button admin-form__button--solid"
                name="intent"
                type="submit"
                value="publish"
              >
                {isEditing ? '수정하기' : '등록하기'}
              </button>
            </div>
          </>
        }
        onSubmit={(event) => {
          event.preventDefault()
          toast.info('현재 UI만 적용되어 저장되지 않습니다.')
        }}
        title={isEditing ? '상품 수정' : '신규 상품 등록'}
      >
        <ProductFormFields draft={draft} onChange={setDraft} />
      </AdminFormLayout>
      <AdminFooter />
    </>
  )
}
