import 'package:flutter/material.dart';

class DesktopLayoutDelegate extends MultiChildLayoutDelegate {
  DesktopLayoutDelegate();

  static String mapLayoutId = 'map';
  static String bottomSheetLayoutId = 'bottom_sheet';
  static String sidebarLayoutId = 'sidebar';
  static String navbarId = 'navbar';
  static String searchRadiusButtonId = 'search_radius';
  static String myLocationButtonId = 'my_location';
  static String navigateButtonId = 'navigate_button'; // NOT USED YET

  @override
  void performLayout(Size size) {
    final bottomSheetSize = layoutChild(
      bottomSheetLayoutId,
      BoxConstraints(
        maxWidth: size.width,
      ),
    );
    positionChild(
        bottomSheetLayoutId, Offset(0, size.height - bottomSheetSize.height));
    final searchRadiusButtonSize =
        layoutChild(searchRadiusButtonId, const BoxConstraints());

    const navbarTopOffset = 80.0;
    Size navbarSize;

    if (bottomSheetSize.height < 50) {
      layoutChild(
        mapLayoutId,
        BoxConstraints(
          maxWidth: size.width - 400,
          maxHeight: size.height,
        ),
      );
      positionChild(mapLayoutId, Offset.zero);
      navbarSize = layoutChild(navbarId, const BoxConstraints(maxWidth: 400));
      positionChild(
        navbarId,
        Offset(size.width - 400, navbarTopOffset),
      );
      layoutChild(myLocationButtonId, const BoxConstraints());
      positionChild(
        myLocationButtonId,
        Offset(
          size.width - 60,
          size.height - 60,
        ),
      );
    } else {
      layoutChild(
        mapLayoutId,
        BoxConstraints(
          maxWidth: size.width,
          maxHeight: size.height - bottomSheetSize.height + 20,
        ),
      );
      positionChild(mapLayoutId, Offset.zero);
      navbarSize = layoutChild(navbarId, BoxConstraints(maxWidth: size.width));
      positionChild(
        navbarId,
        Offset(0, navbarTopOffset),
      );
      final myLocationSize =
          layoutChild(myLocationButtonId, const BoxConstraints());
      positionChild(
        myLocationButtonId,
        Offset(
          size.width - myLocationSize.width,
          size.height - bottomSheetSize.height - myLocationSize.height,
        ),
      );
    }

    final sidebarSize = layoutChild(
      sidebarLayoutId,
      BoxConstraints(
        maxWidth: 400,
        maxHeight: size.height - (navbarTopOffset + navbarSize.height),
      ),
    );
    positionChild(
      sidebarLayoutId,
      Offset(size.width - 400, navbarTopOffset + navbarSize.height),
    );
    positionChild(
      searchRadiusButtonId,
      Offset(
        (size.width - searchRadiusButtonSize.width - sidebarSize.width) / 2,
        size.height - bottomSheetSize.height - 80,
      ),
    );
  }

  @override
  bool shouldRelayout(DesktopLayoutDelegate oldDelegate) {
    return true;
  }
}
