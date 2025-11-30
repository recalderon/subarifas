import { Elysia } from 'elysia';
export declare const receiptRoutes: Elysia<"/api/receipts", false, {
    decorator: {};
    store: {};
    derive: {};
    resolve: {};
}, {
    type: {};
    error: {};
}, {
    schema: {};
    macro: {};
}, {
    api: {
        receipts: {
            ":raffleId": {
                get: {
                    body: unknown;
                    params: Record<"raffleId", string>;
                    query: unknown;
                    headers: unknown;
                    response: {
                        [x: string]: any;
                        200: any;
                    };
                };
            };
        };
    };
} & {
    api: {
        receipts: {
            detail: {
                ":receiptId": {
                    get: {
                        body: unknown;
                        params: Record<"receiptId", string>;
                        query: unknown;
                        headers: unknown;
                        response: {
                            [x: string]: any;
                            200: any;
                        };
                    };
                };
            };
        };
    };
} & {
    api: {
        receipts: {
            ":receiptId": {
                status: {
                    patch: {
                        body: {
                            changedBy?: string | undefined;
                            note?: string | undefined;
                            status: "created" | "waiting_payment" | "expired" | "paid";
                        };
                        params: Record<"receiptId", string>;
                        query: unknown;
                        headers: unknown;
                        response: {
                            [x: string]: any;
                            200: any;
                        };
                    };
                };
            };
        };
    };
}, {
    derive: {};
    resolve: {};
    schema: {};
}, {
    derive: {};
    resolve: {};
    schema: {};
}>;
//# sourceMappingURL=receipts.d.ts.map