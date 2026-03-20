declare module '#auth-utils' {
  interface User {
    id: string
    twitchId: string
    userName: string
    imageUrl: string
  }

  interface UserSession {
    user: User
  }
}

export {}
