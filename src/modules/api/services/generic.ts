import {Injectable} from '@nestjs/common';
import {CrudRequest, GetManyDefaultResponse} from '@nestjsx/crud';
import {TypeOrmCrudService} from '@nestjsx/crud-typeorm';
import {plainToClass} from 'class-transformer';
import {DeepPartial, EntityManager, Repository} from 'typeorm';

import {ErrorUtils, ExceptionBuilder, GenericQueryBuilder, Logger} from '../../../utils';
import {CrudResponse, FilterHelper, ICrudQueryParameters} from '../helpers';

@Injectable()
export class GenericService<T> extends TypeOrmCrudService<T> {
    logger = Logger.getLogger('GenericService');

    responseRelations = [];

    outputColumns = [];

    constructor(
        repo: Repository<T>,
    ) {
        super(repo);
    }

    async create(body: DeepPartial<T>, manager?: EntityManager, Entity?: any): Promise<T> {
        const entityName = this.entityType.name;
        this.logger.trace(`Create ${entityName} object`, 'create');
        const objToSave = body;

        let newObj;
        try {
            const newInstance = this.repo.create();
            Object.entries(objToSave).forEach(([k, v]) => newInstance[k] = v);
            newObj = manager ? await manager.save(Entity, newInstance) : await this.repo.save(newInstance);
        } catch (ex) {
            ErrorUtils.handleDBException(ex, entityName, objToSave);
        }

        return manager ?
            manager.findOne(Entity, newObj.id, {relations: this.responseRelations}) :
            this.repo.findOne(newObj.id, {relations: this.responseRelations});
    }

    async update(id: string, body: DeepPartial<T>): Promise<{oldObject: T; newObject: T}> {
        const entityName = this.entityType.name;
        this.logger.trace(`Update ${entityName} object`, 'update');

        const foundObj = await this.repo.findOne({where: {id}});

        if (!foundObj) {
            ErrorUtils.throwHttpException(ExceptionBuilder.OBJECT_NOT_FOUND, {entity: entityName, id});
        }

        const updatedObj = {...body};
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

    async delete(id: string): Promise<T> {
        const entityName = this.entityType.name;
        this.logger.trace(`Delete ${entityName} object`, 'update');

        const foundObj = await this.repo.findOne({where: {id}});

        if (!foundObj) {
            ErrorUtils.throwHttpException(ExceptionBuilder.OBJECT_NOT_FOUND, {entity: entityName, id});
        }

        const response = plainToClass(this.entityType, {...foundObj});
        try {
            await this.repo.remove(foundObj);
        } catch (ex) {
            throw ErrorUtils.getInternalServerException(ex);
        }

        return response;
    }

    async getById(id: string): Promise<T> {
        const entityName = this.entityType.name;
        this.logger.trace(`Get ${entityName} object (${id})`, 'getById');

        const foundObj = await this.repo.findOne({
            where: {id},
            relations: this.responseRelations,
        });

        if (!foundObj) {
            ErrorUtils.throwHttpException(ExceptionBuilder.OBJECT_NOT_FOUND, {entity: entityName, id});
        }

        return plainToClass(this.entityType, {...foundObj});
    }

    async getAll(req: any, parsedReq: CrudRequest): Promise<GetManyDefaultResponse<T> | T[]> {
        const entityName = this.entityType.name;
        this.logger.trace(`Get all ${entityName} objects`, 'getAll');

        if (req.query && Object.keys(req.query).length > 0) {
            const response = new CrudResponse();

            const data = await this.getData(req.query);
            response.setData(data[0]);
            response.setCount(data[1]);

            return response.get();
        }

        return this.getMany(parsedReq);
    }

    private async getData(queryParams: ICrudQueryParameters = {}): Promise<[T[], number]> {
        const entityName = this.entityType.name.charAt(0).toUpperCase() + this.entityType.name.slice(1);

        let queryBuilder;

        if (queryParams.s) {
            const whereStatementBuilder = new GenericQueryBuilder({tableAlias: entityName});
            const additionalWhereStatement = whereStatementBuilder.getQuerySubStatements(JSON.parse(queryParams.s));
            queryBuilder = queryBuilder.andWhere(additionalWhereStatement);
        }

        if (queryParams.sort) {
            const sortData = FilterHelper.getParsedSort(queryParams.sort, entityName);
            queryBuilder = queryBuilder.orderBy(sortData.field, sortData.value);
        }

        if (queryParams.limit || queryParams.per_page) {
            if (queryParams.limit && queryParams.per_page) {
                ErrorUtils.throwHttpException(ExceptionBuilder.BAD_REQUEST, {parameters: ['limit']});
            }
            const limit = queryParams.limit || queryParams.per_page;
            queryBuilder = queryBuilder.limit(limit);
            if (queryParams.page) {
                queryBuilder = queryBuilder.offset(limit * queryParams.page);
            }
        }

        queryBuilder = queryBuilder.getManyAndCount();
        return this.executeReadQuery(queryBuilder);
    }

    private getQueryBuilderBase() {
        return this.repo.createQueryBuilder(this.entityType.name)
            .select(this.outputColumns);
    }

    private async executeReadQuery(queryBuilder): Promise<[T[], number]> {
        return queryBuilder;
    }
}
