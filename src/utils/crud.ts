import {CrudConfigService, CrudRequest} from '@nestjsx/crud';

export function putPageAndLimitForRequest(req: CrudRequest): any {
    const {page, limit, sort} = req.parsed;

    return {
        ...req,
        parsed: {
            ...req.parsed,
            page: page || 1,
            limit: limit || CrudConfigService.config.query.limit,
            sort,
        },
    };
}
