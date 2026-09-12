import 'package:flutter/material.dart';
import 'package:flutter_common/core/color_palette/color_palette.dart';

class VehicleSelectionScreen extends StatefulWidget {
  final void Function(String vehicleType) onConfirm;
  final bool embedded;

  const VehicleSelectionScreen({super.key, required this.onConfirm, this.embedded = false});

  @override
  State<VehicleSelectionScreen> createState() => _VehicleSelectionScreenState();
}

class _VehicleOption {
  final String id;
  final String title;
  final String subtitle;
  final String imagePath;

  const _VehicleOption({
    required this.id,
    required this.title,
    required this.subtitle,
    required this.imagePath,
  });
}

class _VehicleSelectionScreenState extends State<VehicleSelectionScreen> {
  static const List<_VehicleOption> options = [
    _VehicleOption(
      id: 'passenger',
      title: 'Passenger Auto',
      subtitle: 'Auto rides for passengers',
      imagePath: 'assets/images/passenger_auto.png',
    ),
    _VehicleOption(
      id: 'cargo',
      title: 'Cargo Auto',
      subtitle: 'Goods and parcel delivery',
      imagePath: 'assets/images/cargo_auto.png',
    ),
  ];

  String? selectedVehicle;

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
                const Text(
                  'Select your vehicle',
                  style: TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                    color: Colors.black,
                  ),
                ),
                const SizedBox(height: 20),
                ...options.map((option) {
                  final isSelected = selectedVehicle == option.id;
                  return Padding(
                    padding: const EdgeInsets.only(bottom: 14),
                    child: InkWell(
                      borderRadius: BorderRadius.circular(14),
                      onTap: () => setState(() => selectedVehicle = option.id),
                      child: Container(
                        padding: const EdgeInsets.all(14),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(14),
                          border: Border.all(
                            color: isSelected ? ColorPalette.primary40 : Colors.black12,
                            width: isSelected ? 2 : 1,
                          ),
                        ),
                        child: Row(
                          children: [
                            ClipRRect(
                              borderRadius: BorderRadius.circular(10),
                              child: Image.asset(
                                option.imagePath,
                                width: 64,
                                height: 64,
                                fit: BoxFit.cover,
                              ),
                            ),
                            const SizedBox(width: 14),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    option.title,
                                    style: const TextStyle(
                                      fontSize: 16,
                                      fontWeight: FontWeight.w600,
                                      color: Colors.black,
                                    ),
                                  ),
                                  const SizedBox(height: 4),
                                  Text(
                                    option.subtitle,
                                    style: const TextStyle(fontSize: 13, color: Colors.black54),
                                  ),
                                ],
                              ),
                            ),
                            Radio<String>(
                              value: option.id,
                              groupValue: selectedVehicle,
                              activeColor: ColorPalette.primary40,
                              onChanged: (value) => setState(() => selectedVehicle = value),
                            ),
                          ],
                        ),
                      ),
                    ),
                  );
                }),
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
              backgroundColor: selectedVehicle == null ? ColorPalette.primary80 : ColorPalette.primary40,
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            ),
            onPressed: selectedVehicle == null ? null : () => widget.onConfirm(selectedVehicle!),
            child: const Text(
              'Confirm Vehicle',
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
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        iconTheme: const IconThemeData(color: Colors.black),
      ),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20),
          child: _buildBody(),
        ),
      ),
    );
  }
}
