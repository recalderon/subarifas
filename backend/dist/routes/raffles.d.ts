import { Elysia } from 'elysia';
export declare const raffleRoutes: Elysia<"/api/raffles", false, {
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
        raffles: {
            index: {
                get: {
                    body: unknown;
                    params: Record<never, string>;
                    query: unknown;
                    headers: unknown;
                    response: {
                        [x: string]: any;
                        200: any;
                    };
                };
            };
        };
    } & {
        raffles: {
            ":id": {
                get: {
                    body: unknown;
                    params: Record<"id", string>;
                    query: unknown;
                    headers: unknown;
                    response: {
                        [x: string]: any;
                        200: any;
                    };
                };
            };
        };
    } & {
        raffles: {
            ":id": {
                available: {
                    get: {
                        body: unknown;
                        params: Record<"id", string>;
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
        raffles: {
            derive: {};
            resolve: {};
            schema: {};
            standaloneSchema: {};
            response: {};
        };
    } & {
        raffles: {
            index: {
                post: {
                    body: {
                        expirationHours?: number | undefined;
                        pixQRCode?: string | undefined;
                        title: string;
                        description: string;
                        endDate: string;
                        pages: number;
                        price: number;
                        pixName: string;
                        pixKey: string;
                    };
                    params: Record<never, string>;
                    query: unknown;
                    headers: unknown;
                    response: {
                        [x: string]: any;
                        200: any;
                    };
                };
            };
        };
    } & {
        raffles: {
            ":id": {
                put: {
                    body: {
                        title?: string | undefined;
                        description?: string | undefined;
                        endDate?: string | undefined;
                        pages?: number | undefined;
                        price?: number | undefined;
                        expirationHours?: number | undefined;
                        pixName?: string | undefined;
                        pixKey?: string | undefined;
                        pixQRCode?: string | undefined;
                        winnerNumber?: number | undefined;
                    };
                    params: Record<"id", string>;
                    query: unknown;
                    headers: unknown;
                    response: {
                        [x: string]: any;
                        200: any;
                    };
                };
            };
        };
    } & {
        raffles: {
            ":id": {
                status: {
                    patch: {
                        body: {
                            status: "open" | "waiting" | "closed";
                        };
                        params: Record<"id", string>;
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
        raffles: {
            ":id": {
                delete: {
                    body: unknown;
                    params: Record<"id", string>;
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
//# sourceMappingURL=raffles.d.ts.map