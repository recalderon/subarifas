import { Elysia } from 'elysia';
export declare const selectionRoutes: Elysia<"/api/selections", false, {
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
        selections: {
            receipt: {
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
        selections: {
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
        selections: {
            ":raffleId": {
                post: {
                    body: {
                        number: number;
                        receiptId: string;
                        pageNumber: number;
                        user: {
                            whatsapp: string;
                            xHandle: string;
                            instagramHandle: string;
                            preferredContact: "x" | "instagram" | "whatsapp";
                        };
                    };
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
}, {
    derive: {};
    resolve: {};
    schema: {};
}, {
    derive: {};
    resolve: {};
    schema: {};
}>;
//# sourceMappingURL=selections.d.ts.map