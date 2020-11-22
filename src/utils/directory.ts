import * as fs from 'fs';
import {join} from 'path';

import * as fse from 'fs-extra';

import config from '../configuration';

import {ErrorUtils} from './error/error';
import {ExceptionBuilder} from './error/exception-builder';

export class Directory {

    public readonly root: string;

    constructor(root = '') {
        this.root = join(root);
    }

    public static async init(root: string, conf = {}) {
        const folders = Object.keys(conf);
        const dir = new Directory(root);

        await dir.clear();

        for (let i = 0, il = folders.length; i < il; i++) {
            const dirname = folders[i];
            const subconfig = config[dirname];
            const doUseSubconfig = typeof subconfig === 'object' && subconfig !== null;

            if (doUseSubconfig && dirname === '$files') {
                const filenames = Object.keys(subconfig);

                for (let j = 0, jl = filenames.length; j < jl; j++) {
                    const filename = filenames[j];
                    const content = subconfig[filename];
                    if (typeof content === 'string' || content instanceof Buffer) {
                        await dir.saveFile(filename, content);
                    }
                }
            } else if (doUseSubconfig) {
                await Directory.init(join(dir.root, dirname), subconfig);
            } else {
                await Directory.init(join(dir.root, dirname));
            }
        }

        return dir;
    }

    public async exists(filename?: string) {
        const fullPath = filename ? join(this.root, filename) : this.root;
        return fse.pathExists(fullPath);
    }

    public async make(filePath?: string) {
        const fullpath = filePath ? join(this.root, filePath) : this.root;
        await fse.mkdirs(fullpath);
    }

    public async getFile(filename: string): Promise<Buffer> {
        const fullpath = join(this.root, filename);
        return fse.readFile(fullpath);
    }

    public async saveFile(filename: string, content: string | Buffer, options = {} as fse.WriteFileOptions, sync = false): Promise<void> {
        const fullpath = join(this.root, filename);

        const opts = {
            encoding: Buffer.isBuffer(content) ? null : 'utf8',
            ...options,
        } as fse.WriteFileOptions;

        await fse.outputFile(fullpath, content, opts);

        let data;
        if (sync) {
            if (fs.existsSync(fullpath)) {
                throw new Error('file not exists');
            }
        } else {
            data = await fse.readFile(fullpath, opts);
        }
        if (!data) {
            ErrorUtils.throwHttpException(ExceptionBuilder.FILE_COULD_NOT_BE_UPLOADED);
        }
        return;

    }

    public async clear(filename?: string) {
        const fullpath = filename ? join(this.root, filename) : this.root;
        try {
            await fse.emptyDir(fullpath);
        } catch (err) {
            process.stderr.write(`${err}\n`);
        }
    }

    public async readDir(dirname?: string): Promise<string[]> {
        const fullpath = dirname ? join(this.root, dirname) : this.root;
        return fse.readdir(fullpath);
    }

    public async remove(filename?: string) {
        const fullpath = filename ? join(this.root, filename) : this.root;
        try {
            await fse.remove(fullpath);
        } catch (err) {
            process.stderr.write(`${err}\n`);
        }
    }
}
