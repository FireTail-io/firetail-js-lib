import { FTRequest, FTResponse, FTNext } from "../";

import apiRoutes from "../services/apiRoutes";
import getContext from "../services/getContext";
import matchRequest from "../requestHandlers/matchRequest";
import validateRequest from "../requestHandlers/validateRequest";
import authenticateRequest from "../requestHandlers/authenticateRequest";
import applyResponseHandlers from "../responseHandlers";

export default options => {
    let routes;
    let apiSpec;
    const { apiSpecPromise } = options;

    return async (req: FTRequest, res: FTResponse, next: FTNext) => {
        /**
         * This will apply Proxies to the relevant express.response methods so
         * we can do response validation and logging when the request has been
         * handled by the application.
         */
        applyResponseHandlers(res);

        /**
         * Construct a context object that is attached to the request and
         * response.
         */
        const context = getContext(req, options);
        req.firetailContext = context;
        res.firetailContext = context;

        /**
         * The OpenAPI parser is async and this is a slightly janky way of
         * ensuring that it has finished before we start handling requests.
         */
        await apiSpecPromise;
        try {
            if (!apiSpec) {
                apiSpec = options.apiSpec;
            }

            if (!routes) {
                routes = apiRoutes(apiSpec, context);
            }

            const match = matchRequest(req, routes);
            if (match.error) {
                context.intercepted = true;
                res.setHeader("content-type", "application/problem+json");
                return res.status(match.status).send(match.error);
            }

            const valid = validateRequest(req);
            if (valid.error) {
                context.intercepted = true;
                res.setHeader("content-type", "application/problem+json");
                return res.status(valid.status).send(valid.error);
            }

            const auth = await authenticateRequest(req);
            if (auth.error) {
                context.intercepted = true;
                res.setHeader("content-type", "application/problem+json");
                return res.status(auth.status).send(auth.error);
            }

            return next();
        } catch (e) {
            const status = e.status || 500;
            const error = {
                status: status,
                type: "firetail.middleware.error",
                title: "Failed to handle request",
                ...e.error,
            };
            context.observations.push(error);
            context.intercepted = true;
            res.setHeader("content-type", "application/problem+json");
            return res.status(status).send(error);
        }
    };
};
