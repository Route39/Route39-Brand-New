import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_common/core/color_palette/color_palette.dart';
import 'package:ridy/config/env.dart';
import 'package:ridy/config/locator/locator.dart';
import 'package:ridy/core/extensions/extensions.dart';
import 'package:flutter_common/core/presentation/avatars/app_avatar.dart';
import 'package:flutter_common/core/presentation/buttons/app_close_button.dart';
import 'package:flutter_common/core/presentation/buttons/app_primary_button.dart';
import 'package:ridy/core/presentation/review_parameter_widget.dart';
import 'package:flutter_common/gen/assets.gen.dart';
import 'package:ridy/gen/assets.gen.dart' as rider_assets;
import 'package:flutter_rating_bar/flutter_rating_bar.dart';
import '../blocs/rate_order.bloc.dart';

class RateYourRideSheet extends StatefulWidget {
  final String driverFullName;
  final String? driverAvatarUrl;
  final String orderId;
  final String vehicleName;
  final String serviceName;
  const RateYourRideSheet({
    super.key,
    required this.driverFullName,
    required this.driverAvatarUrl,
    required this.orderId,
    required this.vehicleName,
    required this.serviceName,
  });

  @override
  State<RateYourRideSheet> createState() => _RateYourRideSheetState();
}

class _RateYourRideSheetState extends State<RateYourRideSheet> {
  int? rating;
  String? comment;
  bool isFavorite = false;

  @override
  void initState() {
    super.initState();
    locator<RateOrderBloc>().onStarted();
  }

  @override
  Widget build(BuildContext context) {
    final bloc = locator<RateOrderBloc>();
    return BlocProvider.value(
      value: locator<RateOrderBloc>(),
      child: Center(
        child: Material(
          color: Colors.transparent,
          child: Container(
            width: 340,
            constraints: const BoxConstraints(maxHeight: 560),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(24),
            ),
            clipBehavior: Clip.antiAlias,
            child: SingleChildScrollView(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Align(
                    alignment: Alignment.topRight,
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: AppCloseButton(onPressed: () => Navigator.of(context).pop()),
                    ),
                  ),
                  Transform.translate(
                    offset: const Offset(0, -33),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        AppAvatar(url: widget.driverAvatarUrl, defaultAvatarPath: Env.defaultAvatar),
                        if (rating == null) ...[
                          const SizedBox(height: 8),
                          Text(
                            widget.driverFullName,
                            style: context.titleMedium?.copyWith(color: Colors.black),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            widget.vehicleName,
                            style: context.bodyMedium?.copyWith(color: Colors.grey),
                          ),
                        ],
                      ],
                    ),
                  ),
                  if (rating == null) const SizedBox(height: 16),
                  Text(
                    ratingTitle(context, rating),
                    textAlign: TextAlign.center,
                    style: context.titleLarge?.copyWith(color: Colors.black),
                  ),
                  SizedBox(height: rating == null ? 16 : 8),
                  Center(
                    child: RatingBar.builder(
                      itemSize: rating == null ? 46 : 32,
                      unratedColor: ColorPalette.neutral90,
                      glow: false,
                      allowHalfRating: true,
                      itemBuilder: (context, index) {
                        return AnimatedContainer(
                          duration: const Duration(milliseconds: 300),
                          width: rating == null ? 46 : 32,
                          height: rating == null ? 46 : 32,
                          decoration: const ShapeDecoration(
                            shape: StarBorder(innerRadiusRatio: 0.45, pointRounding: 0.2),
                            color: ColorPalette.primary50,
                          ),
                        );
                      },
                      onRatingUpdate: (value) {
                        setState(() {
                          rating = value.round();
                        });
                      },
                    ),
                  ),
                  const SizedBox(height: 16),
                  if (rating != null)
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      child: BlocBuilder<RateOrderBloc, RateOrderState>(
                        builder: (context, state) {
                          return switch (state) {
                            RateOrderState$ParametersLoaded() => Column(
                                children: [
                                  TextField(
                                    maxLines: 4,
                                    style: const TextStyle(color: Colors.black87),
                                    decoration: InputDecoration(
                                      hintText: context.translate.reviewCommentBoxHint,
                                      hintStyle: const TextStyle(color: Colors.grey),
                                      filled: true,
                                      fillColor: const Color(0xFFF2F2F2),
                                      border: OutlineInputBorder(
                                        borderRadius: BorderRadius.circular(12),
                                        borderSide: BorderSide.none,
                                      ),
                                      enabledBorder: OutlineInputBorder(
                                        borderRadius: BorderRadius.circular(12),
                                        borderSide: BorderSide.none,
                                      ),
                                      focusedBorder: OutlineInputBorder(
                                        borderRadius: BorderRadius.circular(12),
                                        borderSide: BorderSide.none,
                                      ),
                                    ),
                                    onChanged: (value) {
                                      comment = value;
                                    },
                                  ),
                                  const SizedBox(height: 16),
                                  AppPrimaryButton(
                                    onPressed: () {
                                      if (rating != null) {
                                        bloc.onReviewSubmitted(
                                          rating: rating!,
                                          comment: comment,
                                          orderId: widget.orderId,
                                          parameters: const [],
                                          isFavorite: false,
                                        );
                                      }
                                    },
                                    child: Text(context.translate.submitFeedback),
                                  ),
                                ],
                              ),
                            _ => const SizedBox(),
                          };
                        },
                      ),
                    ),
                  const SizedBox(height: 16),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  String ratingTitle(BuildContext context, int? ratingToShow) {
    final name = widget.driverFullName;
    switch (ratingToShow) {
      case 1:
        return context.translate.oneStarReviewTitle(name);
      case 2:
        return context.translate.twoStarReviewTitle(name);
      case 3:
        return context.translate.threeStarReviewTitle(name);
      case 4:
        return context.translate.fourStarReviewTitle(name);
      case 5:
        return context.translate.fiveStarReviewTitle(name);
      default:
        return context.translate.howWasYourTrip;
    }
  }
}
