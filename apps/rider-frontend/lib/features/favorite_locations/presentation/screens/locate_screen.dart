import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:ridy/config/locator/locator.dart';
import 'package:ridy/core/blocs/place_lookup.bloc.dart';
import 'package:ridy/core/extensions/extensions.dart';
import 'package:ridy/features/favorite_locations/presentation/screens/locate_screen.desktop.dart';
import 'package:ridy/features/favorite_locations/presentation/screens/locate_screen.mobile.dart';

@RoutePage()
class LocateFavoriteLocationScreen extends StatelessWidget {
  const LocateFavoriteLocationScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocProvider.value(
      value: locator<PlaceLookupBloc>(),
      child: context.responsive(
        const LocateFavoriteLocationScreenMobile(),
        xl: const LocateFavoriteLocationScreenDesktop(),
      ),
    );
  }
}
