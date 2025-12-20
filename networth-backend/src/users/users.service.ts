import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

@Injectable()
export class UsersService {
    constructor(private prisma: PrismaService) { }

    // In-memory mock storage (reset on server restart)
    // Note: This data is not persistent!
    private users = [
        { id: 'admin-id', email: 'admin@fortstec.com', password: 'Forts@123', role: 'SUPER_ADMIN', name: 'Super Admin' },
        { id: 'user1-id', email: 'user1@edaily.com', password: 'user1', role: 'USER', name: 'User One' },
        { id: 'user2-id', email: 'user2@edaily.com', password: 'user2', role: 'USER', name: 'User Two' },
    ];

    async findByEmail(email: string) {
        // Try DB first
        try {
            const user = await this.prisma.user.findUnique({ where: { email } });
            if (user) return user;
        } catch (e) { }

        // Fallback to mock
        return this.users.find(u => u.email === email);
    }

    async create(data: any) {
        // Mock creation
        const newUser = {
            id: `user-${Date.now()}`,
            ...data,
            password: data.password || '123456',
        };
        this.users.push(newUser);
        return newUser;
    }

    async resetPassword(userId: string) {
        const user = this.users.find(u => u.id === userId);
        if (user) {
            user.password = 'newpassword123';
            return { success: true, newPassword: 'newpassword123', message: 'Password reset successfully' };
        }
        return { success: false, message: 'User not found in mock DB' };
    }

    async getAllUsers() {
        // Return without passwords for list
        return this.users.map(({ password, ...u }) => u);
    }

    async updateUser(userId: string, updateData: { name?: string; email?: string; role?: string }) {
        const userIndex = this.users.findIndex(u => u.id === userId);
        if (userIndex === -1) {
            return { success: false, message: 'User not found' };
        }

        // Update user fields
        if (updateData.name) this.users[userIndex].name = updateData.name;
        if (updateData.email) this.users[userIndex].email = updateData.email;
        if (updateData.role) this.users[userIndex].role = updateData.role;

        // Return updated user without password
        const { password, ...updatedUser } = this.users[userIndex];
        return { success: true, user: updatedUser, message: 'User updated successfully' };
    }
}
