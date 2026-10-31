import 'package:flutter/material.dart';

class TopViewAuto extends StatelessWidget {
  final double width;
  const TopViewAuto({super.key, this.width = 34});

  @override
  Widget build(BuildContext context) =>
      CustomPaint(size: Size(width, width * 1.6), painter: _TopViewAutoPainter());
}

class _TopViewAutoPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final w = size.width, h = size.height;
    final black = Paint()..color = const Color(0xFF1A1A1A);
    RRect r(double l, double t, double rr, double b, double rad) =>
        RRect.fromLTRBR(l, t, rr, b, Radius.circular(rad));

    // shadow
    canvas.drawRRect(r(w * .12, h * .1, w * .88, h * .98, w * .2),
        Paint()..color = Colors.black26..maskFilter = const MaskFilter.blur(BlurStyle.normal, 3));
    // wheels
    canvas.drawRRect(r(w * .42, h * .02, w * .58, h * .16, 2), black);
    canvas.drawRRect(r(0, h * .66, w * .16, h * .88, 2), black);
    canvas.drawRRect(r(w * .84, h * .66, w, h * .88, 2), black);
    // body
    final body = Path()
      ..moveTo(w * .5, h * .04)
      ..quadraticBezierTo(w * .8, h * .08, w * .84, h * .3)
      ..lineTo(w * .86, h * .9)
      ..quadraticBezierTo(w * .86, h * .97, w * .78, h * .97)
      ..lineTo(w * .22, h * .97)
      ..quadraticBezierTo(w * .14, h * .97, w * .14, h * .9)
      ..lineTo(w * .16, h * .3)
      ..quadraticBezierTo(w * .2, h * .08, w * .5, h * .04)
      ..close();
    canvas.drawPath(body, Paint()..color = const Color(0xFF2E9E4F));
    canvas.drawPath(body, Paint()..color = const Color(0xFF145C2C)..style = PaintingStyle.stroke..strokeWidth = 1.5);
    // windshield
    canvas.drawRRect(r(w * .26, h * .2, w * .74, h * .32, 3), Paint()..color = const Color(0xFFBFE6FF));
    // canopy (roof)
    canvas.drawRRect(r(w * .2, h * .36, w * .8, h * .93, w * .12), Paint()..color = const Color(0xFF1F7A3D));
    // roof stripe (yellow, like real autos)
    canvas.drawRect(Rect.fromLTRB(w * .2, h * .6, w * .8, h * .66), Paint()..color = const Color(0xFFFFC928));
    // headlight
    canvas.drawCircle(Offset(w * .5, h * .1), w * .06, Paint()..color = const Color(0xFFFFE680));
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
