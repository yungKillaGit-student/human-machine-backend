import {CrudRequest, ParamsOptions, QueryOptions, RoutesOptions} from '@nestjsx/crud';
import {RequestQueryParser} from '@nestjsx/crud-request';

import {ErrorUtils, ExceptionBuilder} from '../../../utils';

interface IGetRequestFromBodyOptions {
    query?: QueryOptions;
    routes?: RoutesOptions;
    params?: ParamsOptions;
    key?: string;
}

const defaultGetRequestFromBodyOptions: IGetRequestFromBodyOptions = {
    query: {},
    routes: {},
    params: {},
    key: 'query',
};

export class CrudBodyRequest {
    constructor() {}

    static getRequestFromBody(
        body: {query: any} & any,
        options: IGetRequestFromBodyOptions = {},
    ) {

        const {key, query, routes, params} = {...defaultGetRequestFromBodyOptions, ...options};
        const queryObject = body[key];

        if (!queryObject) {
            ErrorUtils.throwHttpException(ExceptionBuilder.BAD_REQUEST);
        }
        if (queryObject.s && !queryObject.search) {
            queryObject.search = queryObject.s;
        }

        const queryParser = RequestQueryParser.create();
        const parsedQuery = queryParser.parseQuery(queryObject);

        if (!parsedQuery.page) {
            parsedQuery.page = queryObject.page || 1;
        }
        // parsedQuery.offset = parsedQuery.page;

        if (!parsedQuery.limit) {
            parsedQuery.limit = queryObject.limit || 100;
        }

        if (!parsedQuery.search) {
            parsedQuery.search = {};
        }
        if (!parsedQuery.search.$and) {
            parsedQuery.search.$and = [];
        }
        for (const [k, v] of Object.entries(parsedQuery.search)) {
            if (k !== '$and') {
                parsedQuery.search.$and.push({[k]: v});
                delete parsedQuery.search[k];
            }
        }
        if (parsedQuery.filter && parsedQuery.filter.length && !parsedQuery.search.$and.length) {
            for (const rule of parsedQuery.filter) {
                parsedQuery.search.$and.push({[rule.field]: {[rule.operator]: rule.value}});
            }
        }

        return {parsed: parsedQuery, options: {query, routes, params}} as CrudRequest;
    }
}
