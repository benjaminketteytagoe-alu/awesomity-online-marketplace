/**
 * Cart domain types.
 *
 * The cart lives entirely on the client. It's a staging area for the
 * items a user is about to order, not a persisted server entity. When
 * the user checks out, we convert it to a PlaceOrderRequest and POST it.
 *
 * Design note: cart items are SNAPSHOTS of products at add time. We
 * store the display data we need (name, price, store) so the cart UI
 * can render without fetching products. The backend re-validates at
 * order time; this snapshot is for UX, not authority.
 */

/**
 * One line in the cart. Product fields are duplicated from the Product
 * type rather than referencing a Product object, because we want the
 * snapshot to remain stable even if the underlying product changes.
 */
export interface CartItem {
  productId: string;
  /** Product name at add time, for display. */
  name: string;
  /** Unit price at add time. The backend re-validates at order time. */
  price: number;
  /** Store name at add time, for display. */
  storeName: string;
  /**
   * Stock level at add time. Used to cap the quantity selector and
   * show "only N available" hints. The backend re-checks at order time.
   */
  stockAtAddTime: number;
  quantity: number;
}
