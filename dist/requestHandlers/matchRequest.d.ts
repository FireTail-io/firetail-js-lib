export default function matchRequest(req: any, routes: any): {
    status: number;
    error: {
        status: number;
        type: string;
        title: string;
    };
} | {
    status?: undefined;
    error?: undefined;
};
