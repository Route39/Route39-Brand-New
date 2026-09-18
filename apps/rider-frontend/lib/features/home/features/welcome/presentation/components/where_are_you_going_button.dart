import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart' show Icons, Colors, BoxFit, Image, FilterQuality;
import 'package:ridy/core/extensions/extensions.dart';

class WhereAreYouGoingButton extends StatelessWidget {
  final VoidCallback? onPressed;
  final String assetPath;

  const WhereAreYouGoingButton({
    super.key,
    this.onPressed,
    this.assetPath = 'assets/images/ev_auto_icon_small.png',
  });

  @override
  Widget build(BuildContext context) {
    return CupertinoButton(
      onPressed: onPressed,
      padding: const EdgeInsets.all(0),
      minimumSize: Size(0, 0),
      child: Container(
        clipBehavior: Clip.hardEdge,
        padding: const EdgeInsets.symmetric(vertical: 0, horizontal: 8),
        decoration: BoxDecoration(
          color: context.theme.inputDecorationTheme.fillColor,
          borderRadius: BorderRadius.circular(8),
          border: Border.all(
            color: context
                .theme.inputDecorationTheme.enabledBorder!.borderSide.color,
          ),
        ),
        child: Row(
          children: [
            Image.asset(
              assetPath,
              width: 60,
              height: 60,
              fit: BoxFit.contain,
              filterQuality: FilterQuality.high,
            ),
            const SizedBox(width: 16),
            Expanded(
                child: Text(
              'Where do you want to go?',
              style: context.bodyLarge
                  ?.copyWith(color: context.theme.colorScheme.onSurfaceVariant),
            )),
            Container(
              width: 36,
              height: 36,
              alignment: Alignment.center,
              decoration: const BoxDecoration(
                shape: BoxShape.circle,
                color: Color(0xFFBA1A1A),
              ),
              child: const Icon(Icons.arrow_forward, color: Colors.white, size: 20),
            ),
          ],
        ),
      ),
    );
  }
}
