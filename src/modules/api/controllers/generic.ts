import {Param, Request} from '@nestjs/common';
import {CrudController, Override, ParsedBody, ParsedRequest} from '@nestjsx/crud';
import {CrudOptions, CrudRequest, GetManyDefaultResponse} from '@nestjsx/crud/lib/interfaces';
import {DeepPartial} from 'typeorm';

import {Temporal} from '../../../entities';
import {GenericService} from '../services';

export const genericCrudSettings: CrudOptions = {
    model: {type: Temporal},
    params: {id: {type: 'uuid', primary: true, field: 'id'}},
    routes: {
        exclude: ['createManyBase', 'replaceOneBase'],
        updateOneBase: {allowParamsOverride: true},
    },
    query: {
        maxLimit: 250,
        alwaysPaginate: false,
    },
};

export class GenericController<Entity, EntityCreateDto, EntityUpdateDto> implements CrudController<Entity> {

    constructor(public service: GenericService<Entity>) { }

    @Override('createOneBase')
    async create(@Request() req, @ParsedBody() body: EntityCreateDto): Promise<Entity> {
        return this.service.create(body);
    }

    @Override('updateOneBase')
    async patch(
        @Request() req,
        @Param('id') id: string,
        @ParsedBody() body: EntityUpdateDto,
    ): Promise<{oldObject: Entity; newObject: Entity}> {
        return this.service.update(id, body);
    }

    @Override('deleteOneBase')
    async delete(@Request() req, @Param('id') id: string): Promise<Entity> {
        return this.service.delete(id);
    }

    @Override('getOneBase')
    async getById(@Request() req, @Param('id') id: string): Promise<Entity> {
        return this.service.getById(id);
    }

    @Override('getManyBase')
    async getAll(@Request() req, @ParsedRequest() parsedReq: CrudRequest): Promise<GetManyDefaultResponse<Entity> | Entity[]> {
        return this.service.getAll(parsedReq, req);
    }
}
