import { Elysia } from 'elysia';
export declare const adminRoutes: Elysia<"/api/admin", false, {
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
        admin: {
            derive: {};
            resolve: {};
            schema: {};
            standaloneSchema: {};
            response: {};
        };
    } & {
        admin: {
            login: {
                post: {
                    body: {
                        username: string;
                        password: string;
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
        admin: {
            init: {
                post: {
                    body: {
                        username: string;
                        password: string;
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
        admin: {
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
        admin: {
            selection: {
                ":raffleId": {
                    ":pageNumber": {
                        ":number": {
                            get: {
                                body: unknown;
                                params: Record<"number" | "raffleId" | "pageNumber", string>;
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
//# sourceMappingURL=admin.d.ts.map