import { useState } from 'react'
import type { KeyboardEvent } from 'react'
import { AdminIcon } from '../AdminIcon'
import './AdminTypeCombobox.css'

type ComboboxItem = {
  readonly isCustom: boolean
  readonly label: string
}

type AdminTypeComboboxProps = {
  readonly allowCustomValue?: boolean
  readonly errorMessage?: string
  readonly inputId: string
  readonly name: string
  readonly onClear?: () => void
  readonly onCommit: (value: string) => void
  readonly onInvalid?: () => void
  readonly options: readonly string[]
  readonly placeholder: string
  readonly readOnly?: boolean
  readonly value: string
}

function normalizeValue(value: string) {
  return value.trim().replace(/\s+/g, ' ')
}

export function AdminTypeCombobox({
  allowCustomValue = false,
  errorMessage,
  inputId,
  name,
  onClear,
  onCommit,
  onInvalid,
  options,
  placeholder,
  readOnly = false,
  value,
}: AdminTypeComboboxProps) {
  const listboxId = `${inputId}-options`
  const errorId = `${inputId}-error`
  const [query, setQuery] = useState(value)
  const [isOpen, setIsOpen] = useState(false)
  const [isFiltering, setIsFiltering] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const normalizedQuery = normalizeValue(query)
  const comparableQuery = normalizedQuery.toLocaleLowerCase('ko-KR')
  const exactOption = options.find(
    (option) => normalizeValue(option).toLocaleLowerCase('ko-KR') === comparableQuery,
  )
  const filterQuery = isFiltering ? comparableQuery : ''
  const filteredOptions = options.filter((option) =>
    normalizeValue(option).toLocaleLowerCase('ko-KR').includes(filterQuery),
  )
  const menuItems: ComboboxItem[] = [
    ...filteredOptions.map((option) => ({ isCustom: false, label: option })),
    ...(allowCustomValue && isFiltering && normalizedQuery && !exactOption
      ? [{ isCustom: true, label: normalizedQuery }]
      : []),
  ]
  const activeItemId =
    activeIndex >= 0 && activeIndex < menuItems.length
      ? `${listboxId}-${activeIndex}`
      : undefined

  function closeAndRestore() {
    setIsOpen(false)
    setIsFiltering(false)
    setActiveIndex(-1)
    setQuery(value)
  }

  function commit(item: ComboboxItem) {
    onCommit(item.label)
    setQuery(item.label)
    setIsOpen(false)
    setIsFiltering(false)
    setActiveIndex(-1)
  }

  function openMenu() {
    setIsOpen(true)
    setIsFiltering(false)
    setActiveIndex(-1)
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setIsOpen(true)
      setActiveIndex((current) =>
        menuItems.length === 0 || current >= menuItems.length - 1 ? 0 : current + 1,
      )
      return
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault()
      setIsOpen(true)
      setActiveIndex((current) =>
        menuItems.length === 0 || current <= 0 ? menuItems.length - 1 : current - 1,
      )
      return
    }

    if (event.key === 'Escape') {
      event.preventDefault()
      closeAndRestore()
      return
    }

    if (event.key !== 'Enter' || event.nativeEvent.isComposing || !normalizedQuery) return

    event.preventDefault()

    const activeItem = menuItems[activeIndex]

    if (activeItem) {
      commit(activeItem)
      return
    }

    if (exactOption) commit({ isCustom: false, label: exactOption })
    else if (allowCustomValue) commit({ isCustom: true, label: normalizedQuery })
  }

  return (
    <span
      className="admin-type-combobox"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) closeAndRestore()
      }}
    >
      <input
        aria-activedescendant={activeItemId}
        aria-autocomplete="list"
        aria-controls={listboxId}
        aria-describedby={errorMessage ? errorId : undefined}
        aria-expanded={isOpen}
        aria-invalid={errorMessage ? true : undefined}
        autoComplete="off"
        className="admin-type-combobox__input"
        id={inputId}
        name={name}
        onChange={(event) => {
          const nextQuery = event.currentTarget.value

          setQuery(nextQuery)
          setIsOpen(true)
          setIsFiltering(true)
          setActiveIndex(-1)

          if (normalizeValue(nextQuery) !== normalizeValue(value)) onClear?.()
        }}
        onClick={openMenu}
        onFocus={openMenu}
        onInvalid={onInvalid}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        readOnly={readOnly}
        required
        role="combobox"
        spellCheck={false}
        type="text"
        value={query}
      />
      <span
        className={
          isOpen
            ? 'admin-type-combobox__icon admin-type-combobox__icon--open'
            : 'admin-type-combobox__icon'
        }
      >
        <AdminIcon name="chevron-down" />
      </span>

      {isOpen ? (
        <span className="admin-type-combobox__menu" id={listboxId} role="listbox">
          {menuItems.map((item, index) => (
            <button
              aria-selected={!item.isCustom && item.label === value}
              className={
                index === activeIndex
                  ? 'admin-type-combobox__option admin-type-combobox__option--active'
                  : 'admin-type-combobox__option'
              }
              id={`${listboxId}-${index}`}
              key={`${item.isCustom}-${item.label}`}
              onClick={() => commit(item)}
              onMouseDown={(event) => event.preventDefault()}
              onMouseEnter={() => setActiveIndex(index)}
              role="option"
              type="button"
            >
              <span>{item.label}</span>
              {item.isCustom ? (
                <span className="admin-type-combobox__option-meta">새 유형 추가 · Enter</span>
              ) : null}
            </button>
          ))}
        </span>
      ) : null}
    </span>
  )
}
