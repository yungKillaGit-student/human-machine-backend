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

export class GenericController<T> implements CrudController<T> {

    constructor(public service: GenericService<T>) { }

    @Override('createOneBase')
    async create(@Request() req, @ParsedBody() body: T): Promise<T> {
        return this.service.create(body);
    }

    @Override('updateOneBase')
    async patch(
        @Request() req,
        @Param('id') id: string,
        @ParsedBody() body: DeepPartial<T>,
    ): Promise<{oldObject: T; newObject: T}> {
        return this.service.update(id, body);
    }

    @Override('deleteOneBase')
    async delete(@Request() req, @Param('id') id: string): Promise<T> {
        return this.service.delete(id);
    }

    @Override('getOneBase')
    async getById(@Request() req, @Param('id') id: string): Promise<T> {
        return this.service.getById(id);
    }

    @Override('getManyBase')
    async getAll(@Request() req, @ParsedRequest() parsedReq: CrudRequest): Promise<GetManyDefaultResponse<T> | T[]> {
        return this.service.getAll(parsedReq, req);
    }
}
