import 'package:flutter/material.dart';
import 'package:flutter_common/core/color_palette/color_palette.dart';
import 'package:flutter_common/core/extensions/extensions.dart';

class AppDrawerItem extends StatefulWidget {
  final IconData icon;
  final String title;
  final bool isSelected;
  final VoidCallback onPressed;
  final int badgeCount;

  const AppDrawerItem({
    super.key,
    required this.icon,
    required this.title,
    required this.onPressed,
    this.badgeCount = 0,
    this.isSelected = false,
  });

  @override
  State<AppDrawerItem> createState() => _AppDrawerItemState();
}

class _AppDrawerItemState extends State<AppDrawerItem> {
  bool isHover = false;
  bool isPressed = false;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onHover: (value) => setState(() => isHover = value),
      onTap: widget.onPressed,
      child: AnimatedContainer(
        margin: const EdgeInsets.only(bottom: 4),
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 24),
        decoration: BoxDecoration(
          color: (isHover || widget.isSelected) ? ColorPalette.primary99 : null,
          borderRadius: BorderRadius.circular(12),
        ),
        child: Row(
          children: [
            Icon(
              widget.icon,
              color: (isHover || widget.isSelected) ? ColorPalette.primary40 : ColorPalette.neutral60,
              size: 24,
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Text(
                widget.title,
                style: context.labelLarge?.copyWith(
                  color: (isHover || widget.isSelected) ? ColorPalette.primary40 : ColorPalette.neutral10,
                ),
              ),
            ),
            if (widget.badgeCount > 0) ...[
              const SizedBox(width: 8),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(color: ColorPalette.error40, borderRadius: BorderRadius.circular(12)),
                child: Text('${widget.badgeCount}', style: context.labelSmall?.copyWith(color: ColorPalette.neutral100)),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
