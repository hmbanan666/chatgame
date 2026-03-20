import type { Character, CharacterEdition } from './tables'

export type CharacterEditionWithCharacter = CharacterEdition & {
  character: Character
}

export type ProfileWithTokens = {
  id: string
  twitchId: string | null
  username: string | null
  twitchTokens: Array<{
    id: string
    status: string
    type: string
    points: number
    language: string
    accessTokenId: string | null
    profileId: string
  }>
}
