export default function matchRequest(req, routes) {
    /**
     * Get the matched route and save it in the context object
     */
    const match = routes.matchReq(req);
    const ctx = req.firetailContext;

    ctx.match = match;

    if (!match) {
        const error = {
            status: 404,
            type: "firetail.route.not.found",
            title: `No route available for path ${req.originalUrl}`,
        };
        ctx.observations.push(error);
        return {
            status: 404,
            error: error,
        };
    }
    if (!match.schema?.[ctx.method]) {
        const error = {
            status: 405,
            type: "firetail.method.not.found",
            title: `Method ${ctx.method} not available for path ${req.originalUrl}`,
        };
        ctx.observations.push(error);
        return {
            status: 405,
            error: error,
        };
    }

    return {};
}
