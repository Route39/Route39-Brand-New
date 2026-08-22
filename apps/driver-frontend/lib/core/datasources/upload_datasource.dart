import 'package:ridy_driver/core/graphql/fragments/media.fragment.graphql.dart';

abstract class UploadDatasource {
  /// Upload using raw bytes + filename — works on both web and native.
  Future<Fragment$Media> uploadProfilePicture(
      String filename, List<int> bytes);

  Future<Fragment$Media> uploadDocument(String filename, List<int> bytes);
}
