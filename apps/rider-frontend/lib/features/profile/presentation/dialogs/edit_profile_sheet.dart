import 'package:api_response/api_response.dart';
import 'package:flutter/material.dart';
import 'package:ridy/config/locator/locator.dart';
import 'package:ridy/core/blocs/auth_bloc.dart';
import 'package:ridy/core/graphql/fragments/profile.fragment.graphql.dart';
import 'package:ridy/core/graphql/schema.gql.dart';
import 'package:ridy/core/repositories/profile_repository.dart';

class EditProfileSheet extends StatefulWidget {
  final Fragment$Profile profile;
  const EditProfileSheet({super.key, required this.profile});

  @override
  State<EditProfileSheet> createState() => _EditProfileSheetState();
}

class _EditProfileSheetState extends State<EditProfileSheet> {
  static const _genders = [Enum$Gender.Male, Enum$Gender.Female, Enum$Gender.Other];
  late final _first = TextEditingController(text: widget.profile.firstName ?? '');
  late final _last = TextEditingController(text: widget.profile.lastName ?? '');
  late final _email = TextEditingController(text: widget.profile.email ?? '');
  late Enum$Gender? _gender = _genders.contains(widget.profile.gender) ? widget.profile.gender : null;
  bool _saving = false;
  String? _error;

  @override
  void dispose() {
    _first.dispose();
    _last.dispose();
    _email.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    final email = _email.text.trim();
    if (_first.text.trim().isEmpty) {
      setState(() => _error = 'Name is required');
      return;
    }
    if (email.isNotEmpty && !RegExp(r'^[^@\s]+@[^@\s]+\.[^@\s]+$').hasMatch(email)) {
      setState(() => _error = 'Invalid email');
      return;
    }
    setState(() {
      _saving = true;
      _error = null;
    });
    final res = await locator<ProfileRepository>().updateProfile(
      input: Input$UpdateRiderInput(
        firstName: _first.text.trim(),
        lastName: _last.text.trim(),
        email: email.isEmpty ? null : email,
        gender: _gender,
      ),
    );
    if (!mounted) return;
    switch (res) {
      case ApiResponseLoaded(:final data):
        locator<AuthBloc>().profileUpdated(data);
        Navigator.of(context).pop();
      case ApiResponseError():
        setState(() {
          _saving = false;
          _error = 'Update failed. Try again.';
        });
      default:
        setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.fromLTRB(20, 20, 20, MediaQuery.of(context).viewInsets.bottom + 20),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text('Edit profile', style: Theme.of(context).textTheme.titleLarge),
          const SizedBox(height: 16),
          TextField(controller: _first, decoration: const InputDecoration(labelText: 'First name')),
          const SizedBox(height: 12),
          TextField(controller: _last, decoration: const InputDecoration(labelText: 'Last name')),
          const SizedBox(height: 12),
          TextField(
            controller: _email,
            keyboardType: TextInputType.emailAddress,
            decoration: const InputDecoration(labelText: 'E-mail'),
          ),
          const SizedBox(height: 12),
          DropdownButtonFormField<Enum$Gender>(
            initialValue: _gender,
            decoration: const InputDecoration(labelText: 'Gender'),
            items: _genders.map((g) => DropdownMenuItem(value: g, child: Text(g.name))).toList(),
            onChanged: (g) => setState(() => _gender = g),
          ),
          if (_error != null) ...[
            const SizedBox(height: 12),
            Text(_error!, style: TextStyle(color: Theme.of(context).colorScheme.error)),
          ],
          const SizedBox(height: 20),
          FilledButton(
            onPressed: _saving ? null : _save,
            child: Text(_saving ? 'Saving...' : 'Save changes'),
          ),
        ],
      ),
    );
  }
}
