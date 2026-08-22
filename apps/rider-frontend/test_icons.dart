import 'package:ionicons/ionicons.dart';
import 'dart:mirrors';

void main() {
  ClassMirror classMirror = reflectClass(Ionicons);
  for (var decl in classMirror.declarations.values) {
    if (decl is VariableMirror && decl.isStatic) {
      print(MirrorSystem.getName(decl.simpleName));
    }
  }
}
