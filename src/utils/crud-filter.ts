import {URLSearchParams} from 'url';

import {CrudRequest} from '@nestjsx/crud';

import {ErrorUtils} from './error/error';
import {ExceptionBuilder} from './error/exception-builder';

export enum EReqFilterOperator {
    eq = '$eq',
    gt = '$gt',
    gte = '$gte',
    lt = '$lt',
    lte = '$lte',
    in = '$in',
}

export enum ECRUDOperator {
    eq = 'eq',
    gt = 'gt',
    gte = 'gte',
    lt = 'lt',
    lte = 'lte',
    in = 'in',
}

export class CrudFilterHelper {
    filter?: CrudRequest;

    searchParams?: URLSearchParams;

    constructor(filter?: CrudRequest) {
        if (filter) {
            this.filter = filter;
        }
    }

    getCRUDRequest() {
        return this.filter;
    }

    setCRUDFilterField(fieldName: string, value: any, operator: ECRUDOperator) {
        const ifFilter = this.filter.parsed && this.filter.parsed.filter;
        const ifSearch = this.filter.parsed && this.filter.parsed.search;

        if (ifFilter.length) {
            this.setFilterField(fieldName, value, operator);
        } else if (ifSearch.$and) {
            this.setSearchField(fieldName, value, operator);
        } else {
            this.setFilterField(fieldName, value, operator);
        }
    }

    setFilterField(field: string, value: any, operator: ECRUDOperator): void {
        for (const i in this.filter.parsed.filter) {
            if (this.filter.parsed.filter[i].field && this.filter.parsed.filter[i].field === field) {
                ErrorUtils.throwHttpException(ExceptionBuilder.FORBIDDEN);
                break;
            }
        }

        const fieldData = {field, operator, value};
        this.filter.parsed.filter.push(fieldData);
    }

    setSearchField(field: string, value: any, operator: ECRUDOperator): void {
        if (!this.filter.parsed.search.$and) {
            return;
        }
        for (const fields of this.filter.parsed.search.$and) {
            if (fields && fields[field]) {
                // delete this.filter.parsed.search.$and[key];
                ErrorUtils.throwHttpException(ExceptionBuilder.FORBIDDEN);
                break;
            }
        }

        const fieldData = {};
        fieldData[field] = {};
        fieldData[field][operator] = value;

        if (this.filter.parsed.search.$and[2] && Object.keys(this.filter.parsed.search.$and[2]).length) {
            this.filter.parsed.search.$and[2] = {...this.filter.parsed.search.$and[2], ...fieldData};
        } else {
            if (this.filter.parsed.search.$and[2]) {
                this.filter.parsed.search.$and[2] = fieldData;
            } else {
                this.filter.parsed.search.$and.push(fieldData);
            }
        }
    }

    deleteCRUDFilterField(fieldName: string) {
        const ifFilter = this.filter.parsed && this.filter.parsed.filter;
        const ifSearch = this.filter.parsed && this.filter.parsed.search;

        if (ifFilter.length) {
            this.deleteFilterField(fieldName);
        } else if (ifSearch.$and) {
            this.deleteSearchField(fieldName);
        } else {
            this.deleteFilterField(fieldName);
        }
    }

    deleteFilterField(field: string): void {
        for (const i in this.filter.parsed.filter) {
            if (this.filter.parsed.filter[i].field && this.filter.parsed.filter[i].field === field) {
                delete this.filter.parsed.filter[i].field;
            }
        }
    }

    deleteSearchField(field: string): void {
        if (!this.filter.parsed.search.$and) {
            return;
        }
        for (const fields of this.filter.parsed.search.$and) {
            if (fields && fields[field]) {
                delete fields[field];
            }
        }
    }
}
