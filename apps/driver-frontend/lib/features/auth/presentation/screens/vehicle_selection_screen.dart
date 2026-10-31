import 'package:flutter/material.dart';
import 'package:flutter_common/core/color_palette/color_palette.dart';

typedef VehicleService = ({String id, String name, String imageUrl});

class VehicleSelectionScreen extends StatefulWidget {
  final void Function(String vehicleType) onConfirm;
  final Future<List<VehicleService>> Function() loadServices;
  final String? initialVehicle;
  final void Function(String? vehicle)? onDraftChanged;
  final bool embedded;

  const VehicleSelectionScreen({
    super.key,
    required this.onConfirm,
    required this.loadServices,
    this.initialVehicle,
    this.onDraftChanged,
    this.embedded = false,
  });

  @override
  State<VehicleSelectionScreen> createState() => _VehicleSelectionScreenState();
}

class _VehicleSelectionScreenState extends State<VehicleSelectionScreen> {
  static const String _fallbackImage = 'assets/images/passenger_auto.png';

  late final Future<List<VehicleService>> _servicesFuture;
  late String? selectedVehicle = widget.initialVehicle;

  @override
  void initState() {
    super.initState();
    _servicesFuture = widget.loadServices().then((list) {
      if (mounted) {
        setState(() {
          if (selectedVehicle != null &&
              !list.any((s) => s.id == selectedVehicle)) {
            selectedVehicle = null;
          }
        });
      }
      return list;
    });
  }

  Widget _image(String url) {
    final fallback = Image.asset(
      _fallbackImage,
      width: 64,
      height: 64,
      fit: BoxFit.cover,
    );
    if (url.isEmpty) return fallback;
    return Image.network(
      url,
      width: 64,
      height: 64,
      fit: BoxFit.cover,
      errorBuilder: (_, __, ___) => fallback,
    );
  }

  Widget _buildOption(VehicleService option) {
    final isSelected = selectedVehicle == option.id;
    return Padding(
      padding: const EdgeInsets.only(bottom: 14),
      child: InkWell(
        borderRadius: BorderRadius.circular(14),
        onTap: () {
          setState(() => selectedVehicle = option.id);
          widget.onDraftChanged?.call(option.id);
        },
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
                child: _image(option.imageUrl),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Text(
                  option.name,
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                    color: Colors.black,
                  ),
                ),
              ),
              Radio<String>(
                value: option.id,
                groupValue: selectedVehicle,
                activeColor: ColorPalette.primary40,
                onChanged: (value) {
                  setState(() => selectedVehicle = value);
                  widget.onDraftChanged?.call(value);
                },
              ),
            ],
          ),
        ),
      ),
    );
  }

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
                FutureBuilder<List<VehicleService>>(
                  future: _servicesFuture,
                  builder: (context, snapshot) {
                    if (snapshot.connectionState != ConnectionState.done) {
                      return const Center(
                        child: Padding(
                          padding: EdgeInsets.all(24),
                          child: CircularProgressIndicator(),
                        ),
                      );
                    }
                    final services = snapshot.data ?? const <VehicleService>[];
                    if (snapshot.hasError || services.isEmpty) {
                      return const Text(
                        'No vehicles are available in this city right now.',
                        style: TextStyle(fontSize: 14, color: Colors.black54),
                      );
                    }
                    return Column(children: services.map(_buildOption).toList());
                  },
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
