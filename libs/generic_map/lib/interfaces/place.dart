import 'package:latlong2/latlong.dart';

class Place {
  final LatLng latLng;
  final String? title;
  final String address;

  const Place(
    this.latLng,
    this.address,
    this.title,
  );

  // copyWith method
  Place copyWith({
    LatLng? latLng,
    String? title,
    String? address,
  }) {
    return Place(
      latLng ?? this.latLng,
      address ?? this.address,
      title ?? this.title,
    );
  }

  // fromJson method
  factory Place.fromJson(Map<String, dynamic> json) {
    return Place(
      LatLng(json['latLng']['latitude'], json['latLng']['longitude']),
      json['address'],
      json['title'],
    );
  }

  // toJson method
  Map<String, dynamic> toJson() {
    return {
      'latLng': {
        'latitude': latLng.latitude,
        'longitude': latLng.longitude,
      },
      'address': address,
      'title': title,
    };
  }

  // toString method
  @override
  String toString() {
    return 'Place{latLng: $latLng, title: $title, address: $address}';
  }

  // == operator
  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;

    return other is Place &&
        other.latLng == latLng &&
        other.title == title &&
        other.address == address;
  }

  // hashCode getter
  @override
  int get hashCode {
    return latLng.hashCode ^ title.hashCode ^ address.hashCode;
  }
}
