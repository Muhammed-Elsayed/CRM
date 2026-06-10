import { publicUserSelect } from '../models/user-model.js'
import { JwtTokenService } from '../middlewares/token.js'
import { prisma } from '../db/config.js'
import { verifyHash } from '../utilities/hash-password.js'
import { WebError } from '../utilities/web-errors.js'
import type { LoginRequestBody } from '../schemas/auth-schema.js'

class AuthService {
    constructor(private readonly tokenService = new JwtTokenService()) {}

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
        const token = this.tokenService.sign({
            userId: publicUser.id,
            email: publicUser.email,
        })

        return {
            user: publicUser,
            token,
        }
    }
}

export { AuthService }
