import React from 'react';
import type { LinkProps } from './link.js';
import type { FlattenSearchParams } from './util.js';
interface NavLinkProps extends LinkProps {
    activeClassName: string;
    activeMatchParams?: FlattenSearchParams;
    matchSubPaths?: boolean;
}
export declare const NavLink: React.ForwardRefExoticComponent<NavLinkProps & React.AnchorHTMLAttributes<HTMLAnchorElement> & React.RefAttributes<HTMLAnchorElement>>;
export {};
//# sourceMappingURL=navLink.d.ts.map