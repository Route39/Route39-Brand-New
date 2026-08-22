import 'package:ridy/core/graphql/fragments/media.fragment.graphql.dart';

abstract class UploadDatasource {
  Future<Fragment$Media> uploadProfilePicture(String filePath);
}
