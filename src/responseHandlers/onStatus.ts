export default function onStatus(responseMethod, res, args) {
    /**
     * The first time we encounter the setting of a status, we make a copy of
     * the status code.
     */
    if (!res.firetailContext.originalStatusCode) {
        res.firetailContext.originalStatusCode = args[0];
    }

    return {};
}
