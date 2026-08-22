import { graphql } from "@/lib/graphql/__generated__";

export const LOGIN2_QUERY = graphql(`
  query Login2($userName: String!, $password: String!) {
    login2(userName: $userName, password: $password, platform: Web, deviceType: DESKTOP) {
      accessToken
      refreshToken
    }
  }
`);

export const REFRESH_TOKEN_QUERY = graphql(`
  query RefreshToken($refreshToken: String!) {
    refreshToken(refreshToken: $refreshToken) {
      accessToken
      refreshToken
    }
  }
`);

export const ME_QUERY = graphql(`
  query Me {
    me {
      id
      firstName
      lastName
      userName
      email
      mobileNumber
      isBlocked
      enabledNotifications
      role {
        id
        title
        permissions
        taxiPermissions
        shopPermissions
        parkingPermissions
      }
      media {
        id
        address
      }
    }
  }
`);
