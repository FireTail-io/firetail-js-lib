export default function getContext(req, options) {
    return {
        ...options,
        /**
         * Metadata for logging the request to the SaaS platform
         */
        startedAt: Date.now(),
        finishedAt: 0,
        method: req.method.toLowerCase(),
        path: req.route?.path || req.originalUrl,
        responseBody: null,
        originalStatusCode: null,
        originalResponseBody: null,
        observations: [],
        /**
         * Utility methods for middleware operation
         */
        match: null,
        /**
         * Booleans for tracking request processing
         */
        logged: false,
        intercepted: false,
        authenticated: false,
        requestValidated: false,
        responseValidated: false,
        responseSanitised: false,
        responseAuthorized: false,
        /**
         * AuthN and AuthZ related information
         */
        authenticatedPrincipal: null,
    };
}
