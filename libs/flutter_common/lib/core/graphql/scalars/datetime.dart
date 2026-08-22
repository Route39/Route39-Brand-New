DateTime fromGraphQLDateTimeToDartDateTime(String data) => DateTime.parse(data).toLocal();

String fromDartDateTimeToGraphQLDateTime(DateTime data) => data.toUtc().toIso8601String();

String? fromDartDateTimeNullableToGraphQLDateTimeNullable(DateTime? datetime) =>
  datetime?.toUtc().toIso8601String();

DateTime? fromGraphQLDateTimeNullableToDartDateTimeNullable(String? iso8601Date) {
  if (iso8601Date == null) {
    return null;
  }
  return DateTime.parse(iso8601Date).toLocal();
}
