export default function authenticateRequest(req: any): Promise<{
    status: any;
    error: {
        status: any;
        type: string;
        title: string;
        details: any;
    };
} | {
    status?: undefined;
    error?: undefined;
}>;
