import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_common/config/constants.dart';
import 'package:generic_map/interfaces/place.dart';
import 'package:ionicons/ionicons.dart';
import 'package:ridy/config/env.dart';
import 'package:ridy/config/locator/locator.dart';
import 'package:ridy/core/blocs/location.bloc.dart';
import 'package:ridy/core/blocs/place_lookup.bloc.dart';
import 'package:ridy/core/blocs/settings.bloc.dart';
import 'package:ridy/core/extensions/extensions.dart';
import 'package:ridy/core/presentation/place_lookup_state_view.dart';

/// Required "Search location" field with inline results (used in Add favorite location).
class InlinePlaceSearchField extends StatefulWidget {
  final Place? selected;
  final ValueChanged<Place?> onChanged;

  const InlinePlaceSearchField({
    super.key,
    required this.selected,
    required this.onChanged,
  });

  @override
  State<InlinePlaceSearchField> createState() => _InlinePlaceSearchFieldState();
}

class _InlinePlaceSearchFieldState extends State<InlinePlaceSearchField> {
  final TextEditingController _controller = TextEditingController();
  String _selectedLabel = '';

  String _labelOf(Place p) => (p.title?.isNotEmpty ?? false) ? p.title! : p.address;

  @override
  void initState() {
    super.initState();
    locator<PlaceLookupBloc>().onStarted();
    final p = widget.selected;
    if (p != null) {
      _selectedLabel = _labelOf(p);
      _controller.text = _selectedLabel;
    }
  }

  @override
  void didUpdateWidget(covariant InlinePlaceSearchField oldWidget) {
    super.didUpdateWidget(oldWidget);
    // Location picked from the map: show its text in this field too
    final p = widget.selected;
    if (p != null && p != oldWidget.selected) {
      final label = _labelOf(p);
      if (_controller.text != label) {
        _selectedLabel = label;
        _controller.text = label;
      }
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    locator<PlaceLookupBloc>().onStarted();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        TextFormField(
          controller: _controller,
          validator: (_) => widget.selected == null ? context.translate.fieldIsRequired : null,
          decoration: InputDecoration(
            prefixIcon: const Icon(Ionicons.search),
            hintText: context.translate.searchLocation,
          ),
          onChanged: (value) {
            // Text edited after a place was chosen -> selection is no longer valid
            if (widget.selected != null && value != _selectedLabel) {
              widget.onChanged(null);
            }
            final settingsState = locator<SettingsCubit>().state;
            final locationState = locator<LocationCubit>().state;
            locator<PlaceLookupBloc>().add(
              PlaceLookupEvent.onQueryChanged(
                query: value,
                latLng: widget.selected?.latLng ?? locationState.place?.latLng ?? Constants.defaultLocation.latLng,
                radius: Env.placeSearchSearchRadius,
                language: settingsState.locale,
                mapProvider: settingsState.mapProvider,
              ),
            );
          },
        ),
        BlocBuilder<PlaceLookupBloc, PlaceLookupState>(
          bloc: locator<PlaceLookupBloc>(),
          builder: (context, state) {
            if (state is PlaceLookupState$Initial) return const SizedBox.shrink();
            if (state is PlaceLookupState$Loading) {
              return const Padding(
                padding: EdgeInsets.all(12),
                child: Center(child: SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2))),
              );
            }
            return Padding(
              padding: const EdgeInsets.only(top: 8),
              child: PlaceLookupStateView(
                state: state,
                onItemSelected: (place) {
                  _selectedLabel = _labelOf(place);
                  _controller.text = _selectedLabel;
                  widget.onChanged(place);
                  locator<PlaceLookupBloc>().onStarted();
                  FocusScope.of(context).unfocus();
                },
              ),
            );
          },
        ),
      ],
    );
  }
}