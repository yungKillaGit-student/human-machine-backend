import {ErrorUtils, ExceptionBuilder} from '../../../utils';

export interface ICrudQueryParameters {
    s?: string;
    sort?: string;
    limit?: number;
    per_page?: number; // eslint-disable-line @typescript-eslint/naming-convention
    page?: number;
}

export class FilterHelper {
    static getParsedSort(querySort: string, tableAlias: string): {field: string; value: string} {
        const sortParts = querySort.split(',');

        if (sortParts.length !== 2) {
            ErrorUtils.throwHttpException(ExceptionBuilder.BAD_REQUEST, {parameters: ['sort']});
        }

        if (!['ASC', 'DESC'].includes(sortParts[1])) {
            ErrorUtils.throwHttpException(ExceptionBuilder.BAD_REQUEST, {parameters: ['sort']});
        }

        return {
            field: `"${tableAlias}"."${sortParts[0]}"`,
            value: sortParts[1],
        };
    }
}
