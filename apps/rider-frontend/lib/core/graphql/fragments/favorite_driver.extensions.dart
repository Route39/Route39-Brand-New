import 'package:flutter/material.dart';
import 'package:ridy/core/extensions/extensions.dart';
import 'package:ridy/core/graphql/fragments/driver.fragment.graphql.dart';
import 'package:ridy/core/graphql/fragments/favorite_driver.fragment.graphql.dart';

extension FavoriteDriverX on Fragment$FavoriteDriver {
  String ratingTitle(BuildContext context, int? ratingToShow) {
    final name = fullName ?? '';
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

extension PastOrderDriverX on Fragment$PastOrderDriver {
  String ratingTitle(BuildContext context, int? ratingToShow) {
    final name = fullName ?? '';
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
