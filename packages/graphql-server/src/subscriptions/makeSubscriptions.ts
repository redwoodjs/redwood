import type {
  RedwoodSubscription,
  SubscriptionGlobImports,
} from '@redwoodjs/realtime'

export const makeSubscriptions = (
  SubscriptionGlobs: SubscriptionGlobImports
): RedwoodSubscription[] => {
  return Object.entries(SubscriptionGlobs).flatMap(
    ([importedGlobName, exports]) => {
      // In case the Subscriptions get nested, their name comes as nested_directory_filename_Subscription

      // SubscriptionName is the filename without the Subscription extension
      // slice gives us ['fileName', 'Subscription'], so we take the first one
      const [SubscriptionNameFromFile] = importedGlobName.split('_').slice(-2)

      // We support exporting both Subscription name and default
      const subscription = {
        schema: exports.schema,
        resolvers: exports[SubscriptionNameFromFile] || exports.default,
        name: SubscriptionNameFromFile,
      } as RedwoodSubscription

      return [subscription]
    }
  )
}
