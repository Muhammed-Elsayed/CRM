import { z } from 'zod'

class AuthSchemas {
    static readonly login = z.object({
        email: z.string().trim().email(),
        password: z.string().min(1),
    })
}

type LoginRequestBody = z.infer<typeof AuthSchemas.login>

export { AuthSchemas }
export type { LoginRequestBody }
