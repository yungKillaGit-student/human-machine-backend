import {Injectable} from '@nestjs/common';
import {InjectRepository} from '@nestjs/typeorm';
import {DeepPartial, EntityManager, Repository} from 'typeorm';

import {Document, Role} from '../../../entities';
import {ErrorUtils, ExceptionBuilder, Logger} from '../../../utils';
import {DocumentCreateDto, DocumentUpdateDto} from '../interfaces';

import {GenericService} from './generic';

@Injectable()
export class DocumentService extends GenericService<Document> {
    logger = Logger.getLogger('DocumentService');

    private readonly roleRepository: Repository<Role>;

    constructor(
        @InjectRepository(Document) repo: Repository<Document>,
        @InjectRepository(Role) roleRepository: Repository<Role>,
    ) {
        super(repo);
        this.roleRepository = roleRepository;
    }

    async create(createDto: DocumentCreateDto, manager?: EntityManager): Promise<Document> {
        const entityName = Document.name;
        this.logger.trace(`Create ${entityName} object`, 'create');
        const objToSave = createDto;

        const {roleName} = createDto;
        const foundRole = await this.roleRepository.findOne({name: roleName});
        if (!foundRole) {
            this.logger.debug(`Role doesn't exist: '${roleName}'`, 'create');
            ErrorUtils.throwHttpException(ExceptionBuilder.OBJECT_NOT_FOUND, {entity: Role.name, name: roleName});
        }

        let newObj;
        try {
            const newInstance = this.repo.create();
            Object.entries(objToSave).forEach(([k, v]) => newInstance[k] = v);
            newInstance.roleId = foundRole.id;
            newObj = manager ? await manager.save(Document, newInstance) : await this.repo.save(newInstance);
        } catch (ex) {
            ErrorUtils.handleDBException(ex, entityName, objToSave);
        }

        return manager ?
            manager.findOne(Document, newObj.id, {relations: this.responseRelations}) :
            this.repo.findOne(newObj.id, {relations: this.responseRelations});
    }

    async update(id: string, updateDto: DocumentUpdateDto): Promise<{oldObject: Document; newObject: Document}> {
        const entityName = Document.name;
        this.logger.trace(`Update ${entityName} object`, 'update');

        const foundObj = await this.repo.findOne({where: {id}});

        if (!foundObj) {
            ErrorUtils.throwHttpException(ExceptionBuilder.OBJECT_NOT_FOUND, {entity: entityName, id});
        }

        const updatedObj: DeepPartial<Document> = {...updateDto};

        const {roleName} = updateDto;
        if (roleName) {
            const foundRole = await this.roleRepository.findOne({name: roleName});
            if (!foundRole) {
                this.logger.debug(`Role doesn't exist: '${roleName}'`, 'create');
                ErrorUtils.throwHttpException(ExceptionBuilder.OBJECT_NOT_FOUND, {entity: Role.name, name: roleName});
            }

            updatedObj.roleId = foundRole.id;
        }

        try {
            const updateResult = await this.repo.update(id, updatedObj);
            ErrorUtils.handleUpdateResult(updateResult, entityName, updatedObj);
        } catch (ex) {
            ErrorUtils.handleDBException(ex, entityName, updatedObj);
        }

        return {
            oldObject: foundObj,
            newObject: await this.repo.findOne(id, {relations: this.responseRelations}),
        };
    }
}
