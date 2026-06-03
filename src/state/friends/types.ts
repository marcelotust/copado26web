export type CollectionVisibility = 'public' | 'friends' | 'private'

export type SharingSettings = {
  ranking_public: boolean
  trading_public: boolean
  email_trade_optin: boolean
}

export type Profile = {
  user_id: string
  nickname: string
  display_name: string
  avatar_url: string | null
  collection_visibility: CollectionVisibility
  ranking_public: boolean
  trading_public: boolean
  email_trade_optin: boolean
  is_test_user: boolean
  created_at?: string
  updated_at?: string
}

export type FriendEntry = {
  user_id: string
  nickname: string
  display_name: string
  avatar_url: string | null
  friendship_created_at: string
  initiated_by: string
}

export type FriendRequest = {
  id: string
  from_user: string
  created_at: string
  nickname: string | null
  display_name: string | null
  avatar_url: string | null
}

export type FriendRequests = {
  pending: FriendRequest[]
}

export type FriendProfile = {
  user_id: string
  nickname: string
  display_name: string
  avatar_url: string | null
  collection_visibility: CollectionVisibility
  stickers: Record<string, number> | null
  progress: { collected: number; total: number } | null
}

export type TradeSuggestions = {
  ok: boolean
  reason: 'not_friends' | 'collection_private' | null
  they_have_i_need: string[]
  i_have_they_need: string[]
}
