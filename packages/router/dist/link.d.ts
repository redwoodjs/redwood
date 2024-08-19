import React from 'react';
import type { NavigateOptions } from './history.js';
export interface LinkProps {
    to: string;
    onClick?: React.MouseEventHandler<HTMLAnchorElement>;
    options?: NavigateOptions;
}
export declare const Link: React.ForwardRefExoticComponent<LinkProps & React.AnchorHTMLAttributes<HTMLAnchorElement> & React.RefAttributes<HTMLAnchorElement>>;
//# sourceMappingURL=link.d.ts.map