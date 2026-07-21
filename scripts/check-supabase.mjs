import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const publishable =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const secret =
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY
const testEmail = process.env.CHECK_SUPABASE_TEST_EMAIL
const testPassword = process.env.CHECK_SUPABASE_TEST_PASSWORD

function missing(name) {
  console.error(`FALTA: ${name}`)
  process.exit(1)
}

if (!url) missing('NEXT_PUBLIC_SUPABASE_URL')
if (!publishable) missing('NEXT_PUBLIC_SUPABASE_ANON_KEY ou NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY')
if (!secret) missing('SUPABASE_SERVICE_ROLE_KEY ou SUPABASE_SECRET_KEY')

const admin = createClient(url, secret, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const { error: adminError } = await admin.auth.admin.listUsers({ page: 1, perPage: 1 })
if (adminError) {
  console.error('ADMIN:', adminError.message)
  process.exit(1)
}

if (testEmail && testPassword) {
  const client = createClient(url, publishable)
  const { error: loginError } = await client.auth.signInWithPassword({
    email: testEmail,
    password: testPassword,
  })
  if (loginError) {
    console.error('LOGIN:', loginError.message)
    process.exit(1)
  }
  console.log('OK — chaves Supabase válidas e login de teste bem-sucedido')
} else {
  console.log(
    'OK — chaves Supabase válidas (teste de login omitido; defina CHECK_SUPABASE_TEST_EMAIL e CHECK_SUPABASE_TEST_PASSWORD para validar credenciais)'
  )
}
