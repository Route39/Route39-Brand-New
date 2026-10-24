import { gql } from "@apollo/client";

const ZONE_FIELDS = `id name status type surgePercent surgeFlat commissionPercent startTime endTime startDate endDate autoLive autoReason autoCreated`;

export const SURGE_ZONES_LIST_QUERY = gql`
  query SurgeZonesList {
    surgeZones(paging: { limit: 200, offset: 0 }, sorting: [{ field: id, direction: DESC }]) {
      totalCount
      nodes { ${ZONE_FIELDS} }
    }
  }
`;

export const SURGE_ZONE_QUERY = gql`
  query SurgeZone($id: ID!) {
    surgeZone(id: $id) { ${ZONE_FIELDS} area { lat lng } }
  }
`;

export const CREATE_SURGE_ZONE_MUTATION = gql`
  mutation CreateSurgeZone($input: SurgeZoneInput!) {
    createOneSurgeZone(input: { surgeZone: $input }) { id }
  }
`;

export const UPDATE_SURGE_ZONE_MUTATION = gql`
  mutation UpdateSurgeZone($id: ID!, $input: SurgeZoneInput!) {
    updateOneSurgeZone(input: { id: $id, update: $input }) { id }
  }
`;

export const DELETE_SURGE_ZONE_MUTATION = gql`
  mutation DeleteSurgeZone($id: ID!) {
    deleteOneSurgeZone(input: { id: $id }) { id }
  }
`;

const SETTING_FIELDS = `id isEnabled autoSurgeEnabled defaultSurgePercent maxSurgePercent commissionPercent autoDemandRatio autoWindowMinutes notifyDrivers notifyRadiusMeters stackingMode gridEnabled gridSizeMeters tierLowRatio tierMidRatio tierHighRatio tierLowPercent tierMidPercent tierHighPercent rainExtraPercent`;

export const SURGE_SETTINGS_QUERY = gql`
  query SurgeSettings { surgeSettings { ${SETTING_FIELDS} } }
`;

export const CREATE_SURGE_SETTING_MUTATION = gql`
  mutation CreateSurgeSetting($input: SurgeSettingInput!) {
    createOneSurgeSetting(input: { surgeSetting: $input }) { ${SETTING_FIELDS} }
  }
`;

export const UPDATE_SURGE_SETTING_MUTATION = gql`
  mutation UpdateSurgeSetting($id: ID!, $input: SurgeSettingInput!) {
    updateOneSurgeSetting(input: { id: $id, update: $input }) { ${SETTING_FIELDS} }
  }
`;
