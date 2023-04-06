export default function validateRequest(req: any): {
    status?: undefined;
    error?: undefined;
} | {
    status: any;
    error: {
        status: any;
        type: string;
        title: string;
        details: any;
    };
};
