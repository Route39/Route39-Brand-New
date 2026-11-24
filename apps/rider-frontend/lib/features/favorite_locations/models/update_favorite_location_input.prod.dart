import 'package:ridy/core/graphql/fragments/point.extensions.dart';
import 'package:ridy/core/graphql/schema.gql.dart';

import 'update_favorite_location_input.dart';

extension UpdateFavoriteLocationInputX on UpdateFavoriteLocationInput {
  /// Address text to store: "<place name>, <address>", never empty.
  String get savedDetails {
    final address = place.address.trim();
    final placeTitle = (place.title ?? '').trim();
    if (address.isEmpty) {
      return placeTitle.isNotEmpty
          ? placeTitle
          : '${place.latLng.latitude.toStringAsFixed(5)}, ${place.latLng.longitude.toStringAsFixed(5)}';
    }
    if (placeTitle.isNotEmpty && !address.toLowerCase().contains(placeTitle.toLowerCase())) {
      return '$placeTitle, $address';
    }
    return address;
  }

  Input$CreateRiderAddressInput get toGql {
    return Input$CreateRiderAddressInput(
      title: name,
      details: savedDetails,
      type: type,
      location: place.latLng.toPointInput,
      phoneNumber: Input$PhoneNumberInput(
        countryCode: phone.$1.e164CountryCode,
        number: phone.$2!,
      ),
    );
  }
}
