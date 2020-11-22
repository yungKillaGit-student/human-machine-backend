import {
    Controller, Get, HttpStatus, UsePipes, ValidationPipe,
} from '@nestjs/common';
import {ApiOperation, ApiResponse, ApiTags} from '@nestjs/swagger';

import {VersionResponseDto} from '../interfaces';
import {VersionService} from '../services';

@ApiTags('version')
@Controller('api/version')
@UsePipes(new ValidationPipe({transform: true}))
export class VersionController {

    constructor(private readonly versionService: VersionService) {
    }

    @ApiOperation({summary: 'Get version'})
    @ApiResponse({status: HttpStatus.OK, description: 'Get version', type: VersionResponseDto})
    @Get()
    get() {
        return this.versionService.get();
    }
}
