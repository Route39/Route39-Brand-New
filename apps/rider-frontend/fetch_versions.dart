import 'dart:convert';
import 'dart:io';

void main() async {
  var httpClient = HttpClient();
  var request = await httpClient.getUrl(Uri.parse('https://pub.dev/api/packages/ionicons'));
  var response = await request.close();
  var responseBody = await response.transform(utf8.decoder).join();
  var data = jsonDecode(responseBody);
  var versions = (data['versions'] as List).map((v) => v['version']).toList();
  print(versions);
}
