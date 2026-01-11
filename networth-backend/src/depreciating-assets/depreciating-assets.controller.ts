import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { DepreciatingAssetsService } from './depreciating-assets.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('depreciating-assets')
@UseGuards(JwtAuthGuard)
export class DepreciatingAssetsController {
    constructor(private readonly depreciatingAssetsService: DepreciatingAssetsService) { }

    @Post()
    create(@Request() req, @Body() createDepreciatingAssetDto: any) {
        return this.depreciatingAssetsService.create(req.user.id, createDepreciatingAssetDto);
    }

    @Get()
    findAll(@Request() req) {
        return this.depreciatingAssetsService.findAll(req.user.id);
    }

    @Get(':id')
    findOne(@Request() req, @Param('id') id: string) {
        return this.depreciatingAssetsService.findOne(req.user.id, id);
    }

    @Patch(':id')
    update(@Request() req, @Param('id') id: string, @Body() updateDepreciatingAssetDto: any) {
        return this.depreciatingAssetsService.update(req.user.id, id, updateDepreciatingAssetDto);
    }

    @Delete(':id')
    remove(@Request() req, @Param('id') id: string) {
        return this.depreciatingAssetsService.remove(req.user.id, id);
    }
}
