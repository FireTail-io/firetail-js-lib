import logResponse from "../firetailLogger";

export default function onEnd(responseMethod, res) {
    /**
     * Once we are in the end, we log the request to the SaaS platform.
     */
    if (!res.firetailContext.logged) {
        res.firetailContext.logged = true;
        res.firetailContext.finishedAt = Date.now();
        logResponse(res);
    }

    return {};
}
