import get from "lodash/get";

export default async function authenticateRequest(req) {
    /**
     * Request authentication via supplied securityHandlers
     */
    const ctx = req.firetailContext;
    const security = ctx.match?.schema?.[ctx.method]?.["x-ft-security"];
    const handler = ctx.match?.securityHandlers?.[ctx.method];

    if (!handler) {
        ctx.observations.push({
            status: 500,
            type: "firetail.security.handler.missing",
            title: "Missing security handler",
            details: { path: ctx.path, method: ctx.method },
        });
    } else {
        try {
            await handler.handle?.(req);
            ctx.authenticated = true;
        } catch (e) {
            const error = {
                status: e.status,
                type: "firetail.request.authentication.failed",
                title: "Failed to validate request",
                details: e,
            };
            ctx.observations.push(error);
            return {
                status: e.status,
                error: error,
            };
        }
    }

    /**
     * Save Authentication related information in the context object.
     */
    const path = security?.["authenticated-principal-path"];
    const resolverId = security?.["authenticated-principal-resolver"];
    const resolver = ctx.identityResolvers?.[resolverId];

    if (resolverId && typeof resolver !== "function") {
        const error = {
            status: 500,
            type: "firetail.authentication.identity.resolver.missing",
            title: "Could not find the defined identity resolver",
            details: {
                resolverId,
            },
        };
        ctx.observations.push(error);
        return {
            status: 500,
            error: error,
        };
    }

    let principal;
    if (path) {
        principal = get(req, path);
    } else if (typeof resolver === "function") {
        principal = await resolver(req);
    }

    if (!principal) {
        const error = {
            status: 500,
            type: "firetail.authenticated.principal.not.defined",
            title: "No authenticated principal defined",
            details: {
                path: ctx.path,
                method: ctx.method,
            },
        };
        ctx.observations.push(error);
    }

    ctx.authenticatedPrincipal = principal;

    return {};
}
