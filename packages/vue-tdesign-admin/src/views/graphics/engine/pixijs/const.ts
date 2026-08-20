
export const bezierSmoothness=0.5;
/**
 * The line cap styles for strokes.
 *
 * It can be:
 * - `butt`: The ends of the stroke are squared off at the endpoints.
 * - `round`: The ends of the stroke are rounded.
 * @category scene
 * @standard
 */
export type LineCap = 'butt' | 'round' | 'square';
/**
 * The line join styles for strokes.
 *
 * It can be:
 * - `round`: The corners of the stroke are rounded.
 * - `bevel`: The corners of the stroke are squared off.
 * - `miter`: The corners of the stroke are extended to meet at a point.
 * @category scene
 * @standard
 */
export type LineJoin = 'round' | 'bevel' | 'miter';

/** @internal */
export const closePointEps = 1e-4;
/** @internal */
export const curveEps = 0.0001;

export interface StrokeAttributes
{
    /**
     * The width of the stroke in pixels.
     * @example
     * ```ts
     * const stroke = { width: 4 };
     * ```
     * @default 1
     */
    width?: number;

    /**
     * The alignment of the stroke relative to the path.
     * - 1: Inside the shape
     * - 0.5: Centered on the path (default)
     * - 0: Outside the shape
     * @example
     * ```ts
     * // Inside alignment
     * const stroke = { alignment: 1 };
     * // Centered alignment
     * const stroke = { alignment: 0.5 };
     * // Outside alignment
     * const stroke = { alignment: 0 };
     * ```
     * @default 0.5
     */
    alignment?: number;

    /**
     * The style to use for the ends of open paths.
     * - 'butt': Ends at path end
     * - 'round': Rounds past path end
     * - 'square': Squares past path end
     * @example
     * ```ts
     * const stroke = { cap: 'round' };
     * ```
     * @default 'butt'
     * @see {@link LineCap} For line cap options
     */
    cap?: LineCap;

    /**
     * The style to use where paths connect.
     * - 'miter': Sharp corner
     * - 'round': Rounded corner
     * - 'bevel': Beveled corner
     * @example
     * ```ts
     * const stroke = { join: 'round' };
     * ```
     * @default 'miter'
     * @see {@link LineJoin} For line join options
     */
    join?: LineJoin;

    /**
     * Controls how far miter joins can extend. Only applies when join is 'miter'.
     * Higher values allow sharper corners.
     * @example
     * ```ts
     * const stroke = {
     *     join: 'miter',
     *     miterLimit: 3,
     * };
     * ```
     * @default 10
     */
    miterLimit?: number;

    /**
     * When true, ensures crisp 1px lines by aligning to pixel boundaries.
     * > [!NOTE] Only available for Graphics fills.
     * @example
     * ```ts
     * const graphics = new Graphics();
     *
     * // Draw pixel-perfect line
     * graphics
     *     .moveTo(50, 50)
     *     .lineTo(150, 50)
     *     .stroke({
     *         width: 1,
     *         pixelLine: true,
     *         color: 0x000000
     *     });
     * ```
     * @default false
     */
    pixelLine?: boolean;
}