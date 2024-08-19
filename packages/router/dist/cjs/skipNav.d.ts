import * as React from 'react';
type Merge<P1 = object, P2 = object> = Omit<P1, keyof P2> & P2;
type ForwardRefExoticComponent<E, OwnProps> = React.ForwardRefExoticComponent<Merge<E extends React.ElementType ? React.ComponentPropsWithRef<E> : never, OwnProps & {
    as?: E;
}>>;
interface ForwardRefComponent<IntrinsicElementString, OwnProps = object> extends ForwardRefExoticComponent<IntrinsicElementString, OwnProps> {
    <As = IntrinsicElementString>(props: As extends '' ? {
        as: keyof JSX.IntrinsicElements;
    } : As extends React.ComponentType<infer P> ? Merge<P, OwnProps & {
        as: As;
    }> : As extends keyof JSX.IntrinsicElements ? Merge<JSX.IntrinsicElements[As], OwnProps & {
        as: As;
    }> : never): React.ReactElement | null;
}
/**
 * SkipNavLink
 *
 * Renders a link that remains hidden until focused to skip to the main content.
 *
 * @see Docs https://reach.tech/skip-nav#skipnavlink
 */
declare const SkipNavLink: ForwardRefComponent<"a", SkipNavLinkProps>;
/**
 * @see Docs https://reach.tech/skip-nav#skipnavlink-props
 */
interface SkipNavLinkProps {
    /**
     * Allows you to change the text for your preferred phrase or localization.
     *
     * @see Docs https://reach.tech/skip-nav#skipnavlink-children
     */
    children?: React.ReactNode;
    /**
     * An alternative ID for `SkipNavContent`. If used, the same value must be
     * provided to the `id` prop in `SkipNavContent`.
     *
     * @see Docs https://reach.tech/skip-nav#skipnavlink-contentid
     */
    contentId?: string;
}
/**
 * SkipNavContent
 *
 * Renders a div as the target for the link.
 *
 * @see Docs https://reach.tech/skip-nav#skipnavcontent
 */
declare const SkipNavContent: ForwardRefComponent<"div", SkipNavContentProps>;
/**
 * @see Docs https://reach.tech/skip-nav#skipnavcontent-props
 */
interface SkipNavContentProps {
    /**
     * You can place the `SkipNavContent` element as a sibling to your main
     * content or as a wrapper.
     *
     * Keep in mind it renders a `div`, so it may mess with your CSS depending on
     * where it’s placed.
     *
     * @example
     *   <SkipNavContent />
     *   <YourMainContent />
     *   // vs.
     *   <SkipNavContent>
     *     <YourMainContent/>
     *   </SkipNavContent>
     *
     * @see Docs https://reach.tech/skip-nav#skipnavcontent-children
     */
    children?: React.ReactNode;
    /**
     * An alternative ID. If used, the same value must be provided to the
     * `contentId` prop in `SkipNavLink`.
     *
     * @see Docs https://reach.tech/skip-nav#skipnavcontent-id
     */
    id?: string;
}
export type { SkipNavContentProps, SkipNavLinkProps };
export { SkipNavLink, SkipNavContent };
//# sourceMappingURL=skipNav.d.ts.map