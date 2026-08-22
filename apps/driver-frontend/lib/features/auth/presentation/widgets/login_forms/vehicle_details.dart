import 'package:ridy_driver/config/locator/locator.dart';
import 'package:ridy_driver/core/extensions/extensions.dart';
import 'package:ridy_driver/features/auth/presentation/blocs/login.bloc.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_common/core/presentation/buttons/app_primary_button.dart';

class VehicleDetails extends StatefulWidget {
  final LoginState state;

  const VehicleDetails({super.key, required this.state});

  @override
  State<VehicleDetails> createState() => _VehicleDetailsState();
}

class _VehicleDetailsState extends State<VehicleDetails> {
  final GlobalKey<FormState> formKey = GlobalKey();

  @override
  Widget build(BuildContext context) {
    final loginBloc = locator<LoginBloc>();
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Expanded(
          child: SingleChildScrollView(
            child: Form(
              key: formKey,
              child: Column(
                children: [
                  Text(
                    "In order to change these information later you have to contact support",
                    style: context.bodyMedium?.copyWith(color: context.theme.colorScheme.onSurfaceVariant),
                  ),
                  const SizedBox(height: 16),
                  TextFormField(
                    initialValue: widget.state.vehiclePlateNumber,
                    validator: (value) => value?.isEmpty == true ? context.translate.fieldIsRequired : null,
                    onChanged: loginBloc.onPlateNumberChanged,
                    decoration: InputDecoration(hintText: context.translate.vehiclePlateNumber),
                  ),
                  const SizedBox(height: 16),
                  TextFormField(
                    initialValue: widget.state.vehicleYear.toString(),
                    inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                    keyboardType: TextInputType.number,
                    validator: (value) => value?.isEmpty == true ? context.translate.fieldIsRequired : null,
                    onSaved: (value) => (value?.isNotEmpty ?? false)
                        ? loginBloc.onVehicleProductionYearChanged(int.parse(value!))
                        : null,
                    decoration: InputDecoration(hintText: context.translate.vehicleProductionYear),
                  ),
                  const SizedBox(height: 16),
                  DropdownButtonFormField<String>(
                    initialValue: widget.state.vehicleModelId,
                    style: context.labelLarge,
                    items: widget.state.vehicleModels
                        .map(
                          (e) => DropdownMenuItem<String>(
                            value: e.id,
                            child: Text(e.name, style: context.labelLarge),
                          ),
                        )
                        .toList(),
                    onChanged: (newValue) => loginBloc.onVehicleModelIdChanged(newValue),
                    onSaved: (newValue) => loginBloc.onVehicleModelIdChanged(newValue),
                    validator: (value) {
                      return value == null ? context.translate.fieldIsRequired : null;
                    },
                    decoration: InputDecoration(hintText: context.translate.vehicleModelAndMake),
                  ),
                  const SizedBox(height: 16),
                  DropdownButtonFormField<String>(
                    initialValue: widget.state.vehicleColorId,
                    style: context.labelLarge,
                    items: widget.state.vehicleColors
                        .map(
                          (e) => DropdownMenuItem<String>(
                            value: e.id,
                            child: Text(e.name, style: context.labelLarge),
                          ),
                        )
                        .toList(),
                    onChanged: (newValue) => loginBloc.onVehicleColorIdChanged(newValue),
                    onSaved: (newValue) => loginBloc.onVehicleColorIdChanged(newValue),
                    validator: (value) => value == null ? context.translate.fieldIsRequired : null,
                    decoration: InputDecoration(hintText: context.translate.vehicleColor),
                  ),
                ],
              ),
            ),
          ),
        ),
        AppPrimaryButton(
          onPressed: () {
            if (formKey.currentState?.validate() == true) {
              formKey.currentState?.save();
              loginBloc.onConfirmVehicleDetailsPressed();
            }
          },
          child: Text(context.translate.confirm),
        ),
      ],
    );
  }
}
