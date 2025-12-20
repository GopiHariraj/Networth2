import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../common/prisma/prisma.service';
import * as argon2 from 'argon2';
import { LoginDto } from './dto/login.dto';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
    constructor(
        private prisma: PrismaService,
        private jwtService: JwtService,
        private usersService: UsersService,
    ) { }

    async validateUser(email: string, pass: string): Promise<any> {
        // Delegate lookup to UsersService (which handles DB + Mock fallback)
        const user = await this.usersService.findByEmail(email);

        if (!user) return null;

        // Check password (simple override for mock users vs hashed real users)
        // If it's a mock user, we might store plain text password in this demo environment
        if (user.password === pass) {
            const { password, ...result } = user;
            return result;
        }

        // For real users with headers (if we had them properly typed from Prisma)
        // const isValid = await argon2.verify(user.passwordHash, pass);

        return null;
    }

    async login(loginDto: LoginDto) {
        const user = await this.validateUser(loginDto.email, loginDto.password);
        if (!user) {
            throw new UnauthorizedException('Invalid credentials');
        }
        const payload = { email: user.email, sub: user.id, role: user.role };
        return {
            access_token: this.jwtService.sign(payload),
            user: {
                id: user.id,
                email: user.email,
                name: user.firstName || user.name,
                role: user.role
            }
        };
    }
}
