import {
  createProduct,
  deleteProduct,
  getAdminProduct,
  updateProduct,
} from '@repo/supabase'
import type { ProductRecord, ProductStatus } from '@repo/supabase'
import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { AdminFooter } from '../components/AdminFooter'
import { AdminDeleteDialog } from '../components/admin-form/AdminDeleteDialog'
import { AdminFormLayout } from '../components/admin-form/AdminFormLayout'
import { supabase } from '../lib/supabase'
import { getSubmitIntent } from './contentListState.ts'
import { ProductFormFields } from './ProductFormFields'
import {
  getProductValidationMessage,
  toProductFormDraft,
  toProductWriteInput,
} from './productFormPersistence.ts'
import { createProductFormDraft } from './productFormGroup.ts'
import type { ProductFormDraft } from './productFormGroup.ts'

function createInitialFormDraft(): ProductFormDraft {
  return createProductFormDraft('브로슈어 · 카탈로그')
}

function getSaveErrorMessage(error: unknown) {
  if (
    error instanceof Error &&
    (error.message.includes('duplicate key') ||
      error.message.includes('products_product_type_key'))
  ) {
    return '이미 등록된 상품 유형입니다.'
  }

  return '상품을 저장하지 못했습니다. 입력값과 권한을 확인해주세요.'
}

type ProductFormUiPageContentProps = {
  readonly productId?: string
}

function ProductFormUiPageContent({ productId }: ProductFormUiPageContentProps) {
  const navigate = useNavigate()
  const isEditing = productId !== undefined
  const [draft, setDraft] = useState(createInitialFormDraft)
  const [loadedProduct, setLoadedProduct] = useState<ProductRecord | null>(null)
  const [isLoadingProduct, setIsLoadingProduct] = useState(isEditing)
  const [loadError, setLoadError] = useState('')
  const [saveError, setSaveError] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    let isCurrent = true
    const id = productId

    if (!id) return

    void getAdminProduct(supabase, id)
      .then((product) => {
        if (!isCurrent) return

        setDraft(toProductFormDraft(product))
        setLoadedProduct(product)
      })
      .catch(() => {
        if (!isCurrent) return

        setLoadError('상품 정보를 불러오지 못했습니다.')
        toast.error('상품 정보를 불러오지 못했습니다.')
      })
      .finally(() => {
        if (isCurrent) setIsLoadingProduct(false)
      })

    return () => {
      isCurrent = false
    }
  }, [productId])

  async function persist(status: ProductStatus) {
    if (isSaving || isDeleting) return

    const validationMessage = getProductValidationMessage(draft, status)

    if (validationMessage) {
      setSaveError(validationMessage)
      toast.error(validationMessage)
      return
    }

    setIsSaving(true)
    setSaveError('')

    try {
      const keepsProductIdentity =
        loadedProduct?.product_type === draft.productType
      const input = toProductWriteInput(
        draft,
        status,
        keepsProductIdentity ? loadedProduct.configuration : undefined,
      )
      const product = productId
        ? await updateProduct(supabase, productId, input)
        : await createProduct(supabase, input)

      toast.success(
        status === 'draft' ? '임시저장했습니다.' : '상품을 저장했습니다.',
      )

      if (status === 'published') {
        navigate('/products')
        return
      }

      setDraft(toProductFormDraft(product))
      setLoadedProduct(product)

      if (!productId) {
        navigate('/products/' + product.id, { replace: true })
      }
    } catch (error) {
      const message = getSaveErrorMessage(error)

      setSaveError(message)
      toast.error(message)
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDelete() {
    if (!productId || isSaving || isDeleting) return

    setIsDeleting(true)
    setSaveError('')

    try {
      await deleteProduct(supabase, productId)
      toast.success('상품을 삭제했습니다.')
      navigate('/products', { replace: true })
    } catch {
      const message = '상품을 삭제하지 못했습니다. 권한을 확인해주세요.'

      setSaveError(message)
      toast.error(message)
    } finally {
      setIsDeleting(false)
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    void persist(getSubmitIntent(event) === 'draft' ? 'draft' : 'published')
  }

  if (isLoadingProduct || loadError) {
    return (
      <>
        <AdminFormLayout
          actions={
            <Link
              className="admin-form__button admin-form__button--outline"
              to="/products"
            >
              목록으로
            </Link>
          }
          onSubmit={(event) => event.preventDefault()}
          title={isEditing ? '상품 수정' : '신규 상품 등록'}
        >
          <p
            className={
              loadError
                ? 'product-ui-hint product-ui-hint--error'
                : 'product-ui-hint'
            }
            role={loadError ? 'alert' : 'status'}
          >
            {loadError || '상품 정보를 불러오는 중입니다.'}
          </p>
        </AdminFormLayout>
        <AdminFooter />
      </>
    )
  }

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
              {isEditing ? (
                <AdminDeleteDialog
                  disabled={isSaving}
                  isDeleting={isDeleting}
                  itemLabel="상품"
                  onConfirm={handleDelete}
                />
              ) : null}
              <button
                className="admin-form__button admin-form__button--outline"
                disabled={isSaving || isDeleting}
                name="intent"
                type="submit"
                value="draft"
              >
                {isSaving ? '저장 중' : '임시저장'}
              </button>
              <button
                className="admin-form__button admin-form__button--solid"
                disabled={isSaving || isDeleting}
                name="intent"
                type="submit"
                value="publish"
              >
                {isSaving ? '저장 중' : isEditing ? '수정하기' : '등록하기'}
              </button>
            </div>
          </>
        }
        onSubmit={handleSubmit}
        title={isEditing ? '상품 수정' : '신규 상품 등록'}
      >
        {saveError ? (
          <p className="product-ui-hint product-ui-hint--error" role="alert">
            {saveError}
          </p>
        ) : null}
        <ProductFormFields draft={draft} onChange={setDraft} />
      </AdminFormLayout>
      <AdminFooter />
    </>
  )
}

export function ProductFormUiPage() {
  const { productId } = useParams<{ productId: string }>()

  return (
    <ProductFormUiPageContent
      key={productId ?? 'new-product'}
      productId={productId}
    />
  )
}
