import assert from 'node:assert/strict'
import { readdir, readFile } from 'node:fs/promises'
import test from 'node:test'
import { URL } from 'node:url'

const migrationsUrl = new URL('../../../supabase/migrations/', import.meta.url)
const migrationName = (await readdir(migrationsUrl)).find((name) =>
  name.endsWith('_group_product_variants.sql'),
)

assert.ok(migrationName, 'group product variants migration is missing')

const migration = await readFile(new URL(migrationName, migrationsUrl), 'utf8')
const baseline = await readFile(
  new URL('../../../supabase/initial_admin_content.sql', import.meta.url),
  'utf8',
)
const seed = await readFile(
  new URL('../../../supabase/seed_products.sql', import.meta.url),
  'utf8',
)
const workbookSync = await readFile(
  new URL(
    '../../../supabase/sync_product_prices_from_excel.sql',
    import.meta.url,
  ),
  'utf8',
)
const legacySubtypeColumn = ['product', 'subtype'].join('_')

test('product migration guards and groups the fixed catalog', () => {
  assert.match(migration, /begin;/i)
  assert.match(migration, /pg_constraint/i)
  assert.match(migration, /mixed statuses/i)
  assert.match(migration, /expected exactly six grouped products/i)
  assert.match(migration, /jsonb_build_object\('variants'/i)
  assert.match(migration, /jsonb_object_keys/i)
  assert.doesNotMatch(migration, /jsonb_object_length/i)
  assert.match(migration, new RegExp(`drop column ${legacySubtypeColumn}`, 'i'))
  assert.match(migration, /unique \(product_type\)/i)
  assert.match(migration, /commit;/i)
})

test('fresh product schema stores one grouped row per type', () => {
  assert.doesNotMatch(baseline, new RegExp(legacySubtypeColumn))
  assert.match(baseline, /unique \(product_type\)/)
  assert.match(baseline, /default '\{"variants": \{\}\}'::jsonb/)
  assert.match(baseline, /configuration -> 'variants'/)
})

test('seed retains ten source variants and inserts six grouped rows', () => {
  assert.match(seed, /\$variants\$/)
  assert.match(seed, /grouped_seed as/i)
  assert.match(seed, /jsonb_object_agg/i)
  assert.match(seed, /jsonb_object_keys/i)
  assert.doesNotMatch(seed, /jsonb_object_length/i)
  assert.match(seed, /on conflict \(product_type\)/i)
  assert.match(seed, /on conflict \(product_type\) do nothing/i)
  assert.doesNotMatch(seed, /set configuration = excluded\.configuration/i)
  assert.match(seed, /Expected result after the initial run: 6 \/ 98 \/ 17\./)
})

test('spreadsheet seed contains only complete price rows', () => {
  const variantsMatch = seed.match(
    /\$variants\$\s*([\s\S]*?)\s*\$variants\$::jsonb/,
  )

  assert.ok(variantsMatch, 'seed variant JSON is missing')

  const variants = JSON.parse(variantsMatch[1])
  const totals = variants.reduce(
    (result, variant) => {
      const priceMaps = variant.configuration.priceRowsBySelection ?? {}

      result.priceSelections += Object.keys(priceMaps).length
      result.priceRows += Object.values(priceMaps).reduce(
        (count, rows) => count + rows.length,
        0,
      )
      result.serviceSelections += Object.keys(
        variant.configuration.serviceEstimatesBySelection ?? {},
      ).length

      for (const rows of Object.values(priceMaps)) {
        for (const row of rows) {
          assert.equal(typeof row.quantity, 'number')
          assert.equal(typeof row.unitPrice, 'number')
          assert.equal(typeof row.printAmount, 'number')
        }
      }

      return result
    },
    { priceSelections: 0, priceRows: 0, serviceSelections: 0 },
  )

  assert.deepEqual(totals, {
    priceSelections: 98,
    priceRows: 272,
    serviceSelections: 17,
  })
  assert.match(seed, /고급지\(랑데뷰\)/)
  assert.doesNotMatch(seed, /고급지\(량데뷰\)/)
  assert.doesNotMatch(seed, /"unitPrice": null/)
  assert.doesNotMatch(seed, /"finalPrice"/)
})

test('workbook reconciliation is transactional and verifies its result', () => {
  assert.match(workbookSync, /begin;/i)
  assert.match(workbookSync, /commit;/i)
  assert.match(workbookSync, /expected exactly six grouped products/i)
  assert.match(workbookSync, /null unit price remains/i)
  assert.match(workbookSync, /Expected result: 6 \/ 98 \/ 272 \/ 17\./)
  assert.doesNotMatch(workbookSync, /jsonb_object_length/i)
})
