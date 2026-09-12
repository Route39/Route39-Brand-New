import 'package:flutter/material.dart';
import 'package:flutter_common/core/color_palette/color_palette.dart';

class CitySelectionScreen extends StatefulWidget {
  final void Function(String city) onConfirm;
  final bool embedded;

  const CitySelectionScreen({super.key, required this.onConfirm, this.embedded = false});

  @override
  State<CitySelectionScreen> createState() => _CitySelectionScreenState();
}

class _CitySelectionScreenState extends State<CitySelectionScreen> {
  static const List<String> cities = [
    'Tiruppur',
    'Bangalore',
    'Coimbatore',
    'Chennai',
  ];

  String? selectedCity;

  Widget _buildBody() {
    return Column(
      mainAxisSize: MainAxisSize.max,
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Expanded(
          child: SingleChildScrollView(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const SizedBox(height: 8),
                Container(
                  width: 56,
                  height: 56,
                  decoration: BoxDecoration(
                    color: ColorPalette.primary40,
                    borderRadius: BorderRadius.circular(28),
                  ),
                  child: const Icon(Icons.location_city, color: Colors.white, size: 28),
                ),
                const SizedBox(height: 24),
                const Text(
                  'Which city do you want to operate in?',
                  style: TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                    color: Colors.black,
                  ),
                ),
                const SizedBox(height: 24),
                DropdownButtonFormField<String>(
                  initialValue: selectedCity,
                  isExpanded: true,
                  hint: const Text(
                    'City selection',
                    style: TextStyle(color: Colors.black54, fontSize: 16),
                  ),
                  icon: const Icon(Icons.keyboard_arrow_down, color: Colors.black),
                  decoration: InputDecoration(
                    filled: true,
                    fillColor: Colors.white,
                    contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: const BorderSide(color: Colors.black26),
                    ),
                    enabledBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: const BorderSide(color: Colors.black26),
                    ),
                    focusedBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: BorderSide(color: ColorPalette.primary40),
                    ),
                  ),
                  style: const TextStyle(color: Colors.black, fontSize: 16),
                  items: cities
                      .map((city) => DropdownMenuItem(
                            value: city,
                            child: Text(city),
                          ))
                      .toList(),
                  onChanged: (value) => setState(() => selectedCity = value),
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 16),
        SizedBox(
          width: double.infinity,
          height: 52,
          child: ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: selectedCity == null ? ColorPalette.primary80 : ColorPalette.primary40,
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            ),
            onPressed: selectedCity == null ? null : () => widget.onConfirm(selectedCity!),
            child: const Text(
              'Confirm City',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
            ),
          ),
        ),
        SizedBox(height: widget.embedded ? 8 : 24),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    if (widget.embedded) {
      return LayoutBuilder(
        builder: (context, constraints) {
          return ConstrainedBox(
            constraints: BoxConstraints(minHeight: constraints.maxHeight),
            child: _buildBody(),
          );
        },
      );
    }

    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24),
          child: _buildBody(),
        ),
      ),
    );
  }
}
