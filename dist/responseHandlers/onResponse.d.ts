export default function onResponse(responseMethod: any, res: any, args: any): Promise<{
    status?: undefined;
    error?: undefined;
} | {
    status: number;
    error: {
        status: number;
        type: string;
        title: string;
        details: any;
    };
}>;
