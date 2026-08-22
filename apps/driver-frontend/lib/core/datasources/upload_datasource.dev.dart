import 'package:ridy_driver/core/datasources/upload_datasource.dart';
import 'package:ridy_driver/core/graphql/fragments/media.fragment.graphql.dart';
import 'package:injectable/injectable.dart';

@dev
@LazySingleton(as: UploadDatasource)
class UploadDatasourceMock implements UploadDatasource {
  @override
  Future<Fragment$Media> uploadProfilePicture(
      String filename, List<int> bytes) async {
    return Fragment$Media(
        id: '1', address: 'https://i.ibb.co/vXkk90M/person.png');
  }

  @override
  Future<Fragment$Media> uploadDocument(
      String filename, List<int> bytes) async {
    return Fragment$Media(
        id: '1', address: 'https://i.ibb.co/vXkk90M/person.png');
  }
}
