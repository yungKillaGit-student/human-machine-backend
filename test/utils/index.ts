import {URL} from 'url';

import {parse} from 'cookie';
import * as RandExp from 'randexp';

export const generatePassword = () => new RandExp(/[A-Z]{4}[a-z]{4}[0-9]{2}/).gen();

export const generateRandomString = (n = 8, dict = 'abcdefghijklmnopqrstuvwxyz0123456789') =>
    new Array(n).fill(null)
        .map(() => dict.charAt(Math.floor(Math.random() * dict.length)))
        .join('');

export const getLicenseDateActive = () => new Date(new Date().setFullYear(new Date().getFullYear() + 5));

export const getLicenseDateExpired = () => new Date(new Date().setFullYear(new Date().getFullYear() - 5));

export const getTokenFromCookie = (headers: any): string => {
    const sc = headers['set-cookie'];
    const cookies = parse(sc ? typeof sc === 'object' ? sc.join(' ') : `${sc}` : '');
    const {token} = cookies;
    return token;
};

export const sortByASC = (list: any[], prop = 'name') => list.sort((a, b) => {
    let parsedA = a[prop];
    let parsedB = b[prop];
    if (typeof parsedA === 'string') {
        parsedA = parsedA.toLowerCase();
    }
    if (typeof parsedB === 'string') {
        parsedB = parsedB.toLowerCase();
    }
    if (parsedA > parsedB) {
        return 1;
    }
    if (parsedB > parsedA) {
        return -1;
    }
    return 0;
});

export const sortByDESC = (list: any[], prop = 'name') => list.sort((a, b) => {
    if (a[prop] > b[prop]) {
        return -1;
    }
    if (b[prop] > a[prop]) {
        return 1;
    }
    return 0;
});

export const wrapHost = (host: string) => /^https?:\/\//.test(host) ? host : `https://${host}`;

export const defaultResponse = {
    data: [],
    count: 0,
    total: 0,
    page: 1,
};
