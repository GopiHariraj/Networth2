import { Controller, Post, Body, Get, Put, Param, UseGuards, UnauthorizedException } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('users')
export class UsersController {
    constructor(private usersService: UsersService) { }

    @Get()
    // @UseGuards(JwtAuthGuard) // Enable in prod
    getAllUsers() {
        return this.usersService.getAllUsers();
    }

    @Post('reset-password')
    // @UseGuards(JwtAuthGuard)
    resetPassword(@Body('userId') userId: string) {
        // Ideally check if request.user.role === 'SUPER_ADMIN'
        return this.usersService.resetPassword(userId);
    }

    @Post('create')
    async createUser(@Body() userData: any) {
        return this.usersService.create(userData);
    }

    @Put(':id')
    // @UseGuards(JwtAuthGuard)
    async updateUser(@Param('id') id: string, @Body() userData: any) {
        // Ideally check if request.user.role === 'SUPER_ADMIN'
        return this.usersService.updateUser(id, userData);
    }
}
