import {Injectable} from '@nestjs/common';

import {version as npmVersion} from '../../../../package.json';
import {Logger, getAppVersion} from '../../../utils';
import {VersionResponseDto} from '../interfaces';

@Injectable()
export class VersionService {
    logger = Logger.getLogger('VersionService');

    constructor() { }

    get(): VersionResponseDto {
        this.logger.trace('get', 'get');

        const version = getAppVersion(npmVersion);
        return {version};
    }
}
