import {
    Controller, Param, Request, UsePipes, ValidationPipe,
} from '@nestjs/common';
import {ApiTags} from '@nestjs/swagger';
import {
    Crud, CrudRequest, GetManyDefaultResponse, Override, ParsedBody, ParsedRequest,
} from '@nestjsx/crud';

import {Event} from '../../../entities';
import {EventCreateDto, EventUpdateDto} from '../interfaces';
import {EventService} from '../services';

import {GenericController, genericCrudSettings} from './generic';

@Crud({
    ...genericCrudSettings,
    ...{
        model: {type: Event},
        dto: {
            create: EventCreateDto,
            update: EventUpdateDto,
        },
        query: {
            sort: [{field: 'title', order: 'ASC'}],
            alwaysPaginate: false,
        },
    },
})
@ApiTags('events')
@Controller('/api/events')
@UsePipes(new ValidationPipe({transform: true}))
export class EventController extends GenericController<Event> {

    constructor(public service: EventService) {
        super(service);
    }

    @Override('createOneBase')
    async create(@Request() req, @ParsedBody() body: EventCreateDto): Promise<Event> {
        return this.service.create(body);
    }

    @Override('updateOneBase')
    async patch(
        @Request() req,
        @Param('id') id,
        @ParsedBody() body: EventUpdateDto,
    ): Promise<{oldObject: Event; newObject: Event}> {
        return this.service.update(id, body);
    }

    @Override('deleteOneBase')
    async delete(@Request() req, @Param('id') id): Promise<Event> {
        return this.service.delete(id);
    }

    @Override('getOneBase')
    async getById(@Request() req, @Param('id') id): Promise<Event> {
        return this.service.getById(id);
    }

    @Override('getManyBase')
    async getAll(@Request() req, @ParsedRequest() parsedReq: CrudRequest): Promise<GetManyDefaultResponse<Event> | Event[]> {
        return this.service.getAll(req, parsedReq);
    }
}
