declare module 'fb-sdk-wrapper' {
  import StatusResponse = facebook.StatusResponse
  import InitParams = facebook.InitParams
  import LoginOptions = facebook.LoginOptions
  import ShareOpenGraphDialogParams = facebook.ShareOpenGraphDialogParams
  import ShareOpenGraphDialogResponse = facebook.ShareOpenGraphDialogResponse
  import AddPageTabDialogParams = facebook.AddPageTabDialogParams
  import DialogResponse = facebook.DialogResponse
  import GameRequestDialogParams = facebook.GameRequestDialogParams
  import GameRequestDialogResponse = facebook.GameRequestDialogResponse
  import PayDialogParams = facebook.PayDialogParams
  import PayDialogResponse = facebook.PayDialogResponse
  import PaymentsLiteDialogParams = facebook.PaymentsLiteDialogParams
  import PaymentsLiteDialogResponse = facebook.PaymentsLiteDialogResponse
  import LiveDialogParams = facebook.LiveDialogParams
  import LiveDialogResponse = facebook.LiveDialogResponse
  import SendDialogParams = facebook.SendDialogParams
  import CreateOfferDialogParams = facebook.CreateOfferDialogParams
  import CreateOfferDialogResponse = facebook.CreateOfferDialogResponse
  import LeadgenDialogParams = facebook.LeadgenDialogParams
  import LeadgenDialogResponse = facebook.LeadgenDialogResponse
  import InstantExperiencesAdsDialogParams = facebook.InstantExperiencesAdsDialogParams
  import InstantExperiencesAdsDialogResponse = facebook.InstantExperiencesAdsDialogResponse
  import InstantExperiencesPreviewDialogParams = facebook.InstantExperiencesPreviewDialogParams
  import CollectionAdsDialogParams = facebook.CollectionAdsDialogParams
  import CollectionAdsDialogResponse = facebook.CollectionAdsDialogResponse
  import ShareDialogParams = facebook.ShareDialogParams
  import ShareDialogResponse = facebook.ShareDialogResponse

  interface LoadParams {
    locale?: string
  }

  export function load(params?: LoadParams): Promise<typeof FB>
  export function init(params?: Partial<InitParams>): void

  export function getGlobalFB(): typeof FB

  export function api<TResponse>(path: string): Promise<TResponse>
  export function api<TParams extends object, TResponse>(
    path: string,
    params: TParams
  ): Promise<TResponse>
  export function api<TParams extends object, TResponse>(
    path: string,
    method: 'get' | 'post' | 'delete',
    params: TParams
  ): Promise<TResponse>

  export function getLoginStatus(force?: boolean): Promise<StatusResponse>
  export function login(options?: LoginOptions): Promise<StatusResponse>
  export function logout(): Promise<StatusResponse>

  /**
   * @see https://developers.facebook.com/docs/sharing/reference/share-dialog
   */
  export function ui(params: ShareDialogParams): Promise<ShareDialogResponse>

  /**
   * @see https://developers.facebook.com/docs/sharing/reference/share-dialog
   */
  export function ui(
    params: ShareOpenGraphDialogParams
  ): Promise<ShareOpenGraphDialogResponse>

  /**
   * @see https://developers.facebook.com/docs/pages/page-tab-dialog
   */
  export function ui(params: AddPageTabDialogParams): Promise<DialogResponse>

  /**
   * @see https://developers.facebook.com/docs/games/services/gamerequests
   */
  export function ui(
    params: GameRequestDialogParams
  ): Promise<GameRequestDialogResponse>

  /**
   * @see https://developers.facebook.com/docs/payments/reference/paydialog
   */
  export function ui(params: PayDialogParams): Promise<PayDialogResponse>

  /**
   * @see https://developers.facebook.com/docs/games_payments/payments_lite
   */
  export function ui(
    params: PaymentsLiteDialogParams
  ): Promise<PaymentsLiteDialogResponse>

  /**
   * @see https://developers.facebook.com/docs/videos/live-video/exploring-live#golivedialog
   */
  export function ui(params: LiveDialogParams): Promise<LiveDialogResponse>

  /**
   * @see https://developers.facebook.com/docs/sharing/reference/send-dialog
   */
  export function ui(params: SendDialogParams): Promise<DialogResponse>

  /**
   * @see https://developers.facebook.com/docs/marketing-api/guides/offer-ads/#create-offer-dialog
   */
  export function ui(
    params: CreateOfferDialogParams
  ): Promise<CreateOfferDialogResponse>

  /**
   * @see https://developers.facebook.com/docs/marketing-api/guides/lead-ads/create#create-leadgen-dialog
   */
  export function ui(
    params: LeadgenDialogParams
  ): Promise<LeadgenDialogResponse>

  /**
   * @see https://developers.facebook.com/docs/marketing-api/guides/canvas-ads#canvas-ads-dialog
   */
  export function ui(
    params: InstantExperiencesAdsDialogParams
  ): Promise<InstantExperiencesAdsDialogResponse>

  /**
   * @see https://developers.facebook.com/docs/marketing-api/guides/canvas-ads#canvas-preview-dialog
   */
  export function ui(
    params: InstantExperiencesPreviewDialogParams
  ): Promise<DialogResponse>

  /**
   * @see https://developers.facebook.com/docs/marketing-api/guides/collection#collection-ads-dialog
   */
  export function ui(
    params: CollectionAdsDialogParams
  ): Promise<CollectionAdsDialogResponse>
}
