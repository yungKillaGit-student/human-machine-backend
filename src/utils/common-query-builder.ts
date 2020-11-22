import {snakeCase} from 'lodash';
import * as moment from 'moment';

function prepareDate(value: any) {
    const dateFormat = 'YYYY-MM-DDTH:mm:ss.SSS Z';
    if (value instanceof Date) {
        return `'${moment(value).format(dateFormat)}'`;
    } else if (typeof value == 'object') {
        if (value && value.length) {
            value.forEach((item, i) => value[i] = item instanceof Date ? `'${moment(item).format(dateFormat)}'` : item);
        }
    }
    return value;
}

export class CommonQueryBuilder {
    public static KEYS = ['$and', '$or'];

    constructor() {
    }

    public getQuerySubStatements(statement: any, logicalKey = 'AND'): string {
        let query = '';
        const statementKeys = Object.keys(statement);

        if (statementKeys.length > 0) {
            statementKeys.forEach((key, i) => {
                if (CommonQueryBuilder.KEYS.indexOf(key) >= 0) {
                    query += '(';
                    if (this.isStatementIncludesLogicalOperators(statement[key])) {
                        statement[key].forEach((value, j) => {
                            query += this.getQuerySubStatements(value, 'AND');
                            query += j != statement[key].length - 1 ? ` ${key} ` : '';
                        });
                    } else {
                        query += this.getSubLogicalComparisons(statement[key], key);
                    }
                    query += ')';
                } else {
                    query += this.getCompareStatement(key, statement[key]);
                }

                if (i != Object.keys(statement).length - 1) {
                    query += ` ${logicalKey} `;
                }
            });
        }
        return query;
    }

    public isStatementIncludesLogicalOperators(statement: any): boolean {
        let isInclude = false;
        if (Array.isArray(statement)) {
            CommonQueryBuilder.KEYS.forEach(key =>
                statement.forEach(value =>
                    value[key] ? isInclude = true : false));
        }
        return isInclude;
    }

    public getSubLogicalComparisons(values: any, logicalKey: string): string {
        let query = '';

        if (logicalKey === '$or') {
            logicalKey = 'OR';
        }
        if (logicalKey === '$and') {
            logicalKey = 'AND';
        }

        Object.keys(values).forEach((key, i) => {
            query += this.getComparisons(values[key]);
            query += i != Object.keys(values).length - 1 ? ` ${logicalKey} ` : '';
        });

        return query;
    }

    public getComparisons(values: any): string {
        let query = '';

        Object.keys(values).forEach((key, i) => {
            query += this.getCompareStatement(key, values[key]);
            query += i != Object.keys(values).length - 1 ? ' AND ' : '';
        });

        return query;
    }

    public getCompareStatement(key: string, value: any): string {
        let statement = '';
        const signs = ['$gt', '$gte', '$lt', '$lte', '$between', '$in', '$starts', '$ends', '$cont'];

        statement = `${snakeCase(key)}`;

        value = prepareValue(value);

        if (typeof value != 'object') {
            statement += `=${value}`;
        } else {
            signs.forEach(sign => statement += this.getSignStatement(value, sign));
        }

        return statement;
    }

    public getSignStatement(value: any, sign: string): string {
        let statement = '';
        if (value[sign]) {
            value[sign] = prepareDate(value[sign]);

            if (['$starts', '$ends', '$cont'].indexOf(sign) >= 0) {
                statement = this.prepareLike(value, sign, statement);
            } else if (sign === '$between') {
                statement = this.prepareBetween(value, sign, statement);
            } else if (sign === '$in') {
                statement = this.prepareInq(value, sign, statement);
            } else {
                if (sign === '$gt') {
                    statement += '>';
                } else if (sign === '$gte') {
                    statement += '>=';
                } else if (sign === '$lt') {
                    statement += '<';
                } else if (sign === '$lte') {
                    statement += '<=';
                } else {
                    statement += '=';
                }

                statement += value[sign];
            }
        }

        return statement;
    }

    public prepareLike(value: any, sign: string, statement) {
        statement += ' LIKE ';
        statement += prepareValue(value[sign], sign);

        return statement;
    }

    public prepareBetween(value: any, sign: string, statement) {
        statement += ' BETWEEN ';
        value[sign].forEach((item, i) => {
            item = prepareValue(item);
            return statement += `${item}${i != value[sign].length - 1 ? ' AND ' : ''}`;
        });

        return statement;
    }

    public prepareInq(value: any, sign: string, statement) {
        statement += ' IN(';
        value[sign].forEach((item, i) => {
            item = prepareValue(item);
            statement += `${item}${i != value[sign].length - 1 ? ', ' : ''}`;
        });
        statement += ')';

        return statement;
    }
}

function prepareValue(value: any, sign?: string) {
    const dateFormat = 'YYYY-MM-DDTH:mm:ss.SSS Z';

    if (typeof value != 'number' && typeof value != 'object') {
        if (value instanceof Date) {
            value = moment(value).format(dateFormat);
        } else if (!value.includes('\'')) {
            if (sign === '$starts') {
                value = `'${value}%'`;
            } else if (sign === '$ends') {
                value = `'%${value}'`;
            } else if (sign === '$cont') {
                value = `'%${value}%'`;
            } else {
                value = `'${value}'`;
            }
        } else {
            if (['$starts', '$ends', '$cont'].indexOf(sign) >= 0 && value.indexOf('\'') === 0) {
                value = value.replace(/'/g, '');
            }
            if (['$starts', '$ends', '$cont'].indexOf(sign) >= 0 && value.indexOf('\'') > 0) {
                value = value.replace(/'/g, '\'\'');
            }
            if (sign === '$starts') {
                value = `'${value}%'`;
            } else if (sign === '$ends') {
                value = `'%${value}'`;
            } else if (sign === '$cont') {
                value = `'%${value}%'`;
            }
        }
    }
    if (Array.isArray(value) && value.length) {
        value.forEach((item, i) => value[i] = prepareValue(item));
    } else if (typeof value == 'object') {
        const objectKeys = Object.keys(value);
        objectKeys.forEach(key => value[key] = prepareValue(value[key]));
    }
    return value;
}
