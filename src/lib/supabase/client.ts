import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database'

let client: ReturnType<typeof createBrowserClient<Database>> | undefined

function getCookies() {
  if (typeof document === 'undefined') {
    return []
  }
  return document.cookie.split('; ').map((cookie) => {
    const [name, ...rest] = cookie.split('=')
    return { name, value: rest.join('=') }
  })
}

function setCookies(cookiesToSet: Array<{ name: string; value: string; options?: any }>) {
  if (typeof document === 'undefined') {
    return
  }
  cookiesToSet.forEach(({ name, value, options }) => {
    let cookie = `${name}=${value}`

    if (options?.maxAge) {
      cookie += `; max-age=${options.maxAge}`
    }
    if (options?.path) {
      cookie += `; path=${options.path}`
    }
    if (options?.domain) {
      cookie += `; domain=${options.domain}`
    }
    if (options?.sameSite) {
      cookie += `; samesite=${options.sameSite}`
    }
    if (options?.secure) {
      cookie += '; secure'
    }

    document.cookie = cookie
  })
}

export function createClient() {
  if (client) {
    return client
  }

  client = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: getCookies,
        setAll: setCookies,
      },
    }
  )

  return client
}
