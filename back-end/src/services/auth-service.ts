import { publicUserSelect } from '../models/user-model.js'
import { generateToken } from '../middlewares/token.js'
import { prisma } from '../db/config.js'
import { verifyHash } from '../utilities/hash-password.js'
import { WebError } from '../utilities/web-errors.js'
import { SessionService } from './session-service.js'
import type { LoginRequestBody } from '../schemas/auth-schema.js'

class AuthService {
    constructor(private readonly sessions = new SessionService()) {}
    async login(credentials: LoginRequestBody) {
        const user = await prisma.user.findUnique({
            where: { email: credentials.email },
            select: {
                ...publicUserSelect,
                passwordHash: true,
            },
        })

        if (!user) {
            throw WebError.UnAuthorized('Invalid email or password')
        }

        const isPasswordValid = await verifyHash(credentials.password, user.passwordHash)

        if (!isPasswordValid) {
            throw WebError.UnAuthorized('Invalid email or password')
        }

        const { passwordHash, ...publicUser } = user
        const token = generateToken(publicUser.id)
        const session = await this.sessions.create(publicUser.id)

        return {
            user: publicUser,
            token,
            ...session,
        }
    }
    async refresh(rawToken: string | undefined) {
        const session = await this.sessions.refresh(rawToken)
        return { ...session, token: generateToken(session.user.id) }
    }

    logout(rawToken: string | undefined) {
        return this.sessions.logout(rawToken)
    }
}

export { AuthService }
