import * as fs from 'fs';

import {
    Controller, Get, HttpStatus, UsePipes, ValidationPipe,
} from '@nestjs/common';
import {ApiOperation, ApiResponse, ApiTags} from '@nestjs/swagger';

import config from '../../../configuration';

@ApiTags('common')
@Controller('api/common')
@UsePipes(new ValidationPipe({transform: true}))
export class CommonController {

    constructor() {
    }

    @ApiOperation({summary: 'Get table from WIKI with all russian regions'})
    @ApiResponse({status: HttpStatus.OK, description: 'Get russian regions'})
    @Get('/russian-regions')
    get() {
        const rawData = fs
            .readFileSync(`${config.assetsDirectory}/json/russian-regions.json`)
            .toString('utf8');
        const {tables}: { tables: any[] } = JSON.parse(rawData);
        const regionsTable: {
            caption: string;
            rows: Record<string, {
                columns: Record<string, string>;
            }>;
        } = tables[0];

        const regionCodeKey = '0';
        const regionNameKey = '1';
        // Delete column headers.
        delete regionsTable.rows['0'];

        const rows = regionsTable.rows;
        return Object.keys(rows).map(x => {
            return {
                name: rows[x].columns[regionNameKey],
                code: rows[x].columns[regionCodeKey],
            };
        });
    }
}
