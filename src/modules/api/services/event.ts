import {Injectable} from '@nestjs/common';
import {InjectRepository} from '@nestjs/typeorm';
import {Repository} from 'typeorm';

import {Event} from '../../../entities';
import {Logger} from '../../../utils';

import {GenericService} from './generic';

@Injectable()
export class EventService extends GenericService<Event> {
    logger = Logger.getLogger('EventService');

    constructor(
        @InjectRepository(Event) repo: Repository<Event>,
    ) {
        super(repo);
    }
}
