import {
    Controller, Param, Request, UsePipes, ValidationPipe,
} from '@nestjs/common';
import {ApiTags} from '@nestjs/swagger';
import {
    Crud, CrudRequest, GetManyDefaultResponse, Override, ParsedBody, ParsedRequest,
} from '@nestjsx/crud';

import {Document} from '../../../entities';
import {DocumentCreateDto, DocumentUpdateDto} from '../interfaces';
import {DocumentService} from '../services';

import {GenericController, genericCrudSettings} from './generic';

@Crud({
    ...genericCrudSettings,
    ...{
        model: {type: Document},
        dto: {
            create: DocumentCreateDto,
            update: DocumentUpdateDto,
        },
        query: {
            sort: [{field: 'title', order: 'ASC'}],
            alwaysPaginate: false,
        },
    },
})
@ApiTags('documents')
@Controller('/api/documents')
@UsePipes(new ValidationPipe({transform: true}))
export class DocumentController extends GenericController<Document, DocumentCreateDto, DocumentUpdateDto> {

    constructor(public service: DocumentService) {
        super(service);
    }

    @Override('createOneBase')
    async create(@Request() req, @ParsedBody() body: DocumentCreateDto): Promise<Document> {
        return this.service.create(body);
    }

    @Override('updateOneBase')
    async patch(
        @Request() req,
        @Param('id') id,
        @ParsedBody() body: DocumentUpdateDto,
    ): Promise<{oldObject: Document; newObject: Document}> {
        return this.service.update(id, body);
    }

    @Override('deleteOneBase')
    async delete(@Request() req, @Param('id') id): Promise<Document> {
        return this.service.delete(id);
    }

    @Override('getOneBase')
    async getById(@Request() req, @Param('id') id): Promise<Document> {
        return this.service.getById(id);
    }

    @Override('getManyBase')
    async getAll(@Request() req, @ParsedRequest() parsedReq: CrudRequest): Promise<GetManyDefaultResponse<Document> | Document[]> {
        return this.service.getAll(req, parsedReq);
    }
}
