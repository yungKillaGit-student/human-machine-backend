import {readFileSync} from 'fs';
import {join} from 'path';

import * as FormData from 'form-data';
import {lookup as getMimeFromName} from 'mime-types';

import config from '../../../../src/configuration';

const {rootPath} = config;

interface ITestFile {
    name: string;
    file: Buffer;
    mime: string;
    withThumbnail?: boolean;
}

export const createForm = (testFile: ITestFile): FormData => {
    const form = new FormData();
    form.append('name', testFile.name);
    form.append('file', testFile.file, {
        contentType: testFile.mime,
        filename: testFile.name,
    });

    return form;
};

export const createTestFile = (name: string, file?: Buffer, mime?: string): ITestFile => ({
    name,
    file: file ? file : readFileSync(join(rootPath, `/test/assets/files/${name}`)),
    mime: mime ? mime : getMimeFromName(name) || '',
});
