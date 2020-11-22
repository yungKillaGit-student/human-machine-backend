import * as revalidator from 'revalidator';

const formatRevalidatorErrors = (errors: Revalidator.IErrrorProperty[]) => errors
    .filter(obj => obj.property && obj.message)
    .map(obj => `${obj.property} ${obj.message}`)
    .join(' | ');

const validateOptions = {
    additionalProperties: false,
    cast: true,
};

export function validate(data: any, schema: Revalidator.JSONSchema<any>, options = {}) {
    const result = revalidator.validate(data, schema, {...validateOptions, ...options});

    return {
        valid: result.valid,
        error: !result.valid ? formatRevalidatorErrors(result.errors) : undefined,
    };
}

export const sleep = (delay = 1000): Promise<void> => new Promise(resolve => setTimeout(resolve, delay));

export const lowerFirstChar = str => str[0].toLowerCase() + str.slice(1);

export const deepLowerFirstChar = obj => {
    for (const key of Object.keys(obj)) {
        const newKey = key === 'LEDSettings' ? 'ledSettings' : lowerFirstChar(key);
        obj[newKey] = typeof obj[key] === 'object' && Object.keys(obj[key]).length ? deepLowerFirstChar(obj[key]) : obj[key];
        delete obj[key];
    }
    return obj;
};
