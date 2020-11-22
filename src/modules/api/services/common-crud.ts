import {Injectable} from '@nestjs/common';
import {CrudRequest, GetManyDefaultResponse} from '@nestjsx/crud';
import {TypeOrmCrudService} from '@nestjsx/crud-typeorm';
import {plainToClass} from 'class-transformer';
import {DeepPartial, Repository} from 'typeorm';

import {ErrorUtils, ExceptionBuilder, Logger} from '../../../utils';

const defaultRelations: {field: string; relation: string}[] = [];

@Injectable()
export class CommonCrudService<T> extends TypeOrmCrudService<T> {
    logger = Logger.getLogger('CommonCrudService');

    responseRelations = [];

    constructor(repo: Repository<T>) {
        super(repo);

        defaultRelations.forEach(i => {
            if (this.entityColumns.includes(i.field) && !this.responseRelations.includes(i.relation)) {
                this.responseRelations.push(i.relation);
            }
        });
    }

    async create(body: DeepPartial<T>): Promise<T> {
        const entityName = this.entityType.name;
        this.logger.trace(`Create ${entityName} object`, 'create');
        const objToSave: any = body;

        let newObj;
        try {
            const newInstance = await this.repo.create();
            Object.entries(objToSave).forEach(([k, v]) => newInstance[k] = v);
            newObj = await this.repo.save(newInstance);
        } catch (ex) {
            ErrorUtils.handleDBException(ex, entityName, body);
        }

        return this.repo.findOne(newObj.id, {relations: this.responseRelations});
    }

    async update(id: number | string, body: DeepPartial<T>): Promise<{ oldObject: T; newObject: T }> {
        const entityName = this.entityType.name;
        this.logger.trace(`Update ${entityName} object`, 'update');

        const foundObj = await this.repo.findOne(id);

        if (!foundObj) {
            ErrorUtils.throwHttpException(ExceptionBuilder.OBJECT_NOT_FOUND, {entity: entityName, id});
        }

        const updatedInstance = await this.repo.create();
        Object.entries(body).forEach(([k, v]) => updatedInstance[k] = v);

        try {
            const updateResult = await this.repo.update(id, updatedInstance);
            ErrorUtils.handleUpdateResult(updateResult, entityName, updatedInstance);
        } catch (ex) {
            ErrorUtils.handleDBException(ex, entityName, updatedInstance);
        }

        return {
            oldObject: foundObj,
            newObject: await this.repo.findOne(id, {relations: this.responseRelations}),
        };
    }

    async delete(id: number | string, alreadyFoundObj?: T): Promise<T> {
        const entityName = this.entityType.name;
        this.logger.trace(`Delete ${entityName} object`, 'delete');

        const foundObj = alreadyFoundObj ? alreadyFoundObj : await this.repo.findOne(id);

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

    async getById(id: number | string): Promise<T> {
        const entityName = this.entityType.name;
        this.logger.trace(`Get ${entityName} object`, 'getById');

        this.entityRelationsHash.forEach((value, key) => {
            if (!this.responseRelations.includes(key)) {
                this.responseRelations.push(key);
            }
        });

        const foundObj = await this.repo.findOne(id, {relations: this.responseRelations});

        if (!foundObj) {
            ErrorUtils.throwHttpException(ExceptionBuilder.OBJECT_NOT_FOUND, {entity: entityName, id});
        }

        return plainToClass(this.entityType, {...foundObj});
    }

    async getAll(req: any, parsedReq: CrudRequest): Promise<GetManyDefaultResponse<T> | T[]> {
        const entityName = this.entityType.name;
        this.logger.trace(`get all ${entityName} objects`, 'getAll');

        return this.getMany(parsedReq);
    }

    static async getDistinct(
        repo: any,
        tableName: string,
        columnName: string,
        modelProp: string,
        orderDirection: 'ASC'| 'DESC' = 'ASC',
        orderColumn?: string,
    ): Promise<any> {
        const tableColumn = `${columnName}`;
        if (!orderColumn) {
            orderColumn = tableColumn;
        }
        let base = repo
            .createQueryBuilder()
            .select(`${tableColumn} as value${orderColumn !== tableColumn ? `, ${orderColumn} as additionalValue` : ''}`);

        base.groupBy(tableColumn);
        if (orderColumn !== tableColumn) {
            base = base.addGroupBy(orderColumn);
        }

        const distinct = await base
            .orderBy(orderColumn, orderDirection)
            .getRawMany();

        const valuesArray = distinct.map(item => item.value);

        return {[modelProp]: valuesArray};

    }
}
