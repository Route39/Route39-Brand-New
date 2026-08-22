import 'dart:io';
import 'dart:convert';

void main() async {
  final currentDir = Directory.current;

  // Find all .arb files except intl_en.arb
  final arbFiles = currentDir
      .listSync()
      .where(
        (file) =>
            file is File &&
            file.path.endsWith('.arb') &&
            !file.path.endsWith('intl_en.arb'),
      )
      .cast<File>();

  for (final file in arbFiles) {
    try {
      // Read the file content
      final content = await file.readAsString();
      final Map<String, dynamic> data = json.decode(content);

      // Remove metadata entries (keys starting with @) except @locale
      final cleanedData = Map<String, dynamic>.from(data);
      cleanedData.removeWhere(
        (key, value) => key.startsWith('@') && key != '@@locale',
      );

      // Write back the cleaned data
      final cleanedJson = JsonEncoder.withIndent('  ').convert(cleanedData);
      await file.writeAsString(cleanedJson);

      print('Cleaned metadata from: ${file.path}');
    } catch (e) {
      print('Error processing ${file.path}: $e');
    }
  }

  print('Done cleaning metadata from .arb files');
}
