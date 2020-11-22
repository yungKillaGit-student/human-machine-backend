export function getAppVersion(version: string): string {
    return version.split('.')
        .map((v, i) => i !== 2 ? v : process.env['VERSION_PATCH'] || v)
        .join('.');
}
