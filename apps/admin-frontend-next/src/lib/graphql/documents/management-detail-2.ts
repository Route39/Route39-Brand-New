import { graphql } from "@/lib/graphql/__generated__";

// Drivers
export const CREATE_DRIVER_MUTATION = graphql(`
  mutation CreateDriver($input: UpdateDriverInput!) {
    createOneDriver(input: { driver: $input }) {
      id
    }
  }
`);

export const UPDATE_DRIVER_MUTATION = graphql(`
  mutation UpdateDriver($id: ID!, $input: UpdateDriverInput!) {
    updateOneDriver(input: { id: $id, update: $input }) {
      id
    }
  }
`);

export const DELETE_DRIVER_MUTATION = graphql(`
  mutation DeleteDriver($id: ID!) {
    deleteOneDriver(id: $id) {
      id
    }
  }
`);

// Riders
export const CREATE_RIDER_MUTATION = graphql(`
  mutation CreateRider($input: RiderInput!) {
    createOneRider(input: { rider: $input }) {
      id
    }
  }
`);

export const UPDATE_RIDER_MUTATION = graphql(`
  mutation UpdateRider($id: ID!, $input: RiderInput!) {
    updateOneRider(input: { id: $id, update: $input }) {
      id
    }
  }
`);

export const DELETE_RIDER_MUTATION = graphql(`
  mutation DeleteRider($id: ID!) {
    deleteOneRider(id: $id) {
      id
    }
  }
`);

// CarColor
export const CAR_COLOR_QUERY = graphql(`
  query CarColor($id: ID!) {
    carColor(id: $id) {
      id
      name
    }
  }
`);

export const CREATE_CAR_COLOR_MUTATION = graphql(`
  mutation CreateCarColor($input: CarColorInput!) {
    createOneCarColor(input: { carColor: $input }) {
      id
    }
  }
`);

export const UPDATE_CAR_COLOR_MUTATION = graphql(`
  mutation UpdateCarColor($id: ID!, $input: CarColorInput!) {
    updateOneCarColor(input: { id: $id, update: $input }) {
      id
    }
  }
`);

export const DELETE_CAR_COLOR_MUTATION = graphql(`
  mutation DeleteCarColor($id: ID!) {
    deleteOneCarColor(input: { id: $id }) {
      id
    }
  }
`);

// CarModel
export const CAR_MODEL_QUERY = graphql(`
  query CarModel($id: ID!) {
    carModel(id: $id) {
      id
      name
    }
  }
`);

export const CREATE_CAR_MODEL_MUTATION = graphql(`
  mutation CreateCarModel($input: CarModelInput!) {
    createOneCarModel(input: { carModel: $input }) {
      id
    }
  }
`);

export const UPDATE_CAR_MODEL_MUTATION = graphql(`
  mutation UpdateCarModel($id: ID!, $input: CarModelInput!) {
    updateOneCarModel(input: { id: $id, update: $input }) {
      id
    }
  }
`);

export const DELETE_CAR_MODEL_MUTATION = graphql(`
  mutation DeleteCarModel($id: ID!) {
    deleteOneCarModel(input: { id: $id }) {
      id
    }
  }
`);

// Settings
export const UPDATE_PASSWORD_MUTATION = graphql(`
  mutation UpdatePassword($input: UpdatePasswordInput!) {
    updatePassword(input: $input) {
      id
    }
  }
`);

export const UPDATE_CONFIGURATIONS_MUTATION = graphql(`
  mutation UpdateConfigurations($input: UpdateConfigInputV2!) {
    updateConfigurations(input: $input) {
      status
      message
    }
  }
`);

export const CURRENT_CONFIGURATION_QUERY = graphql(`
  query CurrentConfiguration {
    currentConfiguration {
      backendMapsAPIKey
      adminPanelAPIKey
      companyName
      companyLogo
    }
  }
`);

// Region detail
export const REGION_QUERY = graphql(`
  query Region($id: ID!) {
    region(id: $id) {
      id
      name
      currency
      enabled
      categoryId
      location {
        lat
        lng
      }
    }
  }
`);

export const CREATE_REGION_MUTATION = graphql(`
  mutation CreateRegion($input: CreateRegionInput!) {
    createOneRegion(input: { region: $input }) {
      id
    }
  }
`);

export const UPDATE_REGION_MUTATION = graphql(`
  mutation UpdateRegion($id: ID!, $input: UpdateRegionInput!) {
    updateOneRegion(input: { id: $id, update: $input }) {
      id
    }
  }
`);

export const DELETE_REGION_MUTATION = graphql(`
  mutation DeleteRegion($id: ID!) {
    deleteOneRegion(input: { id: $id }) {
      id
    }
  }
`);

// ZonePrice detail
export const ZONE_PRICE_QUERY = graphql(`
  query ZonePrice($id: ID!) {
    zonePrice(id: $id) {
      id
      name
      cost
      from {
        lat
        lng
      }
      to {
        lat
        lng
      }
      timeMultipliers {
        startTime
        endTime
        multiply
      }
    }
  }
`);

export const CREATE_ZONE_PRICE_MUTATION = graphql(`
  mutation CreateZonePrice($input: ZonePriceInput!) {
    createOneZonePrice(input: { zonePrice: $input }) {
      id
    }
  }
`);

export const UPDATE_ZONE_PRICE_MUTATION = graphql(`
  mutation UpdateZonePrice($id: ID!, $input: ZonePriceInput!) {
    updateOneZonePrice(input: { id: $id, update: $input }) {
      id
    }
  }
`);

export const DELETE_ZONE_PRICE_MUTATION = graphql(`
  mutation DeleteZonePrice($id: ID!) {
    deleteOneZonePrice(input: { id: $id }) {
      id
    }
  }
`);

// Service detail
export const SERVICE_QUERY = graphql(`
  query Service($id: ID!) {
    service(id: $id) {
      id
      name
      description
      personCapacity
      categoryId
      baseFare
      orderTypes
      displayPriority
      perHundredMeters
      perMinuteDrive
      perMinuteWait
      prepayPercent
      minimumFee
      searchRadius
      paymentMethod
      cancellationTotalFee
      cancellationDriverShare
      providerSharePercent
    }
  }
`);

export const SERVICE_CATEGORIES_QUERY = graphql(`
  query ServiceCategories {
    serviceCategories(filter: {}, sorting: []) {
      id
      name
    }
  }
`);

export const CREATE_SERVICE_MUTATION = graphql(`
  mutation CreateService($input: ServiceInput!) {
    createOneService(input: { service: $input }) {
      id
    }
  }
`);

export const UPDATE_SERVICE_MUTATION = graphql(`
  mutation UpdateService($id: ID!, $input: ServiceInput!) {
    updateOneService(input: { id: $id, update: $input }) {
      id
    }
  }
`);

export const DELETE_SERVICE_MUTATION = graphql(`
  mutation DeleteService($id: ID!) {
    deleteOneService(input: { id: $id }) {
      id
    }
  }
`);

// Fleet detail
export const FLEET_QUERY = graphql(`
  query Fleet($id: ID!) {
    fleet(id: $id) {
      id
      name
      phoneNumber
      mobileNumber
      userName
      isBlocked
      address
      commissionSharePercent
      commissionShareFlat
      feeMultiplier
      exclusivityAreas {
        lat
        lng
      }
    }
  }
`);

export const CREATE_FLEET_MUTATION = graphql(`
  mutation CreateFleet($input: CreateFleetInput!) {
    createOneFleet(input: { fleet: $input }) {
      id
    }
  }
`);

export const UPDATE_FLEET_MUTATION = graphql(`
  mutation UpdateFleet($id: ID!, $input: UpdateFleetInput!) {
    updateOneFleet(input: { id: $id, update: $input }) {
      id
    }
  }
`);

export const DELETE_FLEET_MUTATION = graphql(`
  mutation DeleteFleet($id: ID!) {
    deleteOneFleet(input: { id: $id }) {
      id
    }
  }
`);
