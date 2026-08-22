// ignore_for_file: depend_on_referenced_packages

import 'dart:convert';

import 'package:ridy_driver/core/graphql/fragments/media.fragment.graphql.dart';
import 'package:injectable/injectable.dart';
import 'package:http/http.dart';
import 'package:ridy_driver/config/env.dart';
import 'package:ridy_driver/config/locator/locator.dart';
import 'package:ridy_driver/core/blocs/auth_bloc.dart';
import 'package:path/path.dart' as path;

import 'upload_datasource.dart';

@prod
@LazySingleton(as: UploadDatasource)
class UploadDatasourceImpl implements UploadDatasource {
  UploadDatasourceImpl();

  @override
  Future<Fragment$Media> uploadProfilePicture(
      String filename, List<int> bytes) async {
    final token = locator<AuthBloc>().state.jwtToken;
    if (token == null) throw Exception('Token is null');
    final serverUrl = '${Env.serverUrl}upload_profile';
    return _uploadBytes(serverUrl, token, filename, bytes);
  }

  @override
  Future<Fragment$Media> uploadDocument(
      String filename, List<int> bytes) async {
    final token = locator<AuthBloc>().state.jwtToken;
    if (token == null) throw Exception('Token is null');
    final serverUrl = '${Env.serverUrl}upload_document';
    return _uploadBytes(serverUrl, token, filename, bytes);
  }

  /// Web-compatible upload: uses [MultipartFile.fromBytes] which works on all
  /// platforms, whereas [MultipartFile.fromPath] requires dart:io (native only).
  Future<Fragment$Media> _uploadBytes(
    String serverUrl,
    String authorizationToken,
    String filename,
    List<int> bytes,
  ) async {
    final postUri = Uri.parse(serverUrl);
    final request = MultipartRequest('POST', postUri);
    request.headers['Authorization'] = 'Bearer $authorizationToken';
    request.files.add(
      MultipartFile.fromBytes('file', bytes, filename: filename),
    );
    final streamedResponse = await request.send();
    final response = await Response.fromStream(streamedResponse);
    final json = jsonDecode(response.body);
    final media = Fragment$Media.fromJson(json);
    return Fragment$Media(id: media.id, address: media.address);
  }
}
