export interface RscFetchProps extends Record<string, unknown> {
    location: {
        pathname: string;
        search: string;
    };
}
export declare function rscFetch(rscId: string, props: RscFetchProps): Thenable<import("react").ReactElement<any, string | import("react").JSXElementConstructor<any>>>;
//# sourceMappingURL=rscFetchForClientRouter.d.ts.map