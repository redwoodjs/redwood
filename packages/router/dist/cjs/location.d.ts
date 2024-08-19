import React from 'react';
import type { TrailingSlashesTypes } from './util.js';
export interface LocationContextType extends URL {
}
declare const LocationContext: React.Context<LocationContextType | undefined>;
interface Location extends URL {
}
interface LocationProviderProps {
    location?: Location;
    trailingSlashes?: TrailingSlashesTypes;
    children?: React.ReactNode;
}
interface LocationProviderState {
    context: Location | undefined;
}
declare class LocationProvider extends React.Component<LocationProviderProps, LocationProviderState> {
    static contextType: React.Context<LocationContextType | undefined>;
    context: React.ContextType<typeof LocationContext>;
    HISTORY_LISTENER_ID: string | undefined;
    state: LocationProviderState;
    getContext(): URL | undefined;
    componentDidMount(): void;
    componentWillUnmount(): void;
    render(): React.JSX.Element;
}
declare const useLocation: () => LocationContextType;
export { LocationProvider, LocationContext, useLocation };
//# sourceMappingURL=location.d.ts.map