import 'package:flutter/material.dart';
import 'package:flutter_common/core/color_palette/color_palette.dart';
import 'package:ridy_driver/config/locator/locator.dart';
import '../blocs/login.bloc.dart';
import 'driving_license_upload_screen.dart';
import 'profile_info_screen.dart';
import 'vehicle_rc_screen.dart';
import 'aadhaar_pan_screen.dart';

class DocumentChecklistScreen extends StatelessWidget {
  final LoginState loginState;
  final VoidCallback onConfirm;
  final bool embedded;

  const DocumentChecklistScreen({
    super.key,
    required this.loginState,
    required this.onConfirm,
    this.embedded = false,
  });

  Future<void> _showLicenseSheet(BuildContext context) async {
    bool? tempAnswer = loginState.hasDrivingLicense;

    final result = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (sheetContext) {
        return StatefulBuilder(
          builder: (sheetContext, setSheetState) {
            return Padding(
              padding: EdgeInsets.only(
                left: 24,
                right: 24,
                top: 24,
                bottom: MediaQuery.of(sheetContext).viewInsets.bottom + 24,
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Do you have a Driving License?',
                    style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: Colors.black),
                  ),
                  const SizedBox(height: 16),
                  RadioListTile<bool>(
                    contentPadding: EdgeInsets.zero,
                    value: true,
                    groupValue: tempAnswer,
                    activeColor: ColorPalette.primary40,
                    title: const Text('Yes', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600, color: Colors.black)),
                    subtitle: const Text('Get Passenger Auto + Cargo orders', style: TextStyle(color: Colors.black54)),
                    onChanged: (value) => setSheetState(() => tempAnswer = value),
                  ),
                  const Divider(height: 1),
                  RadioListTile<bool>(
                    contentPadding: EdgeInsets.zero,
                    value: false,
                    groupValue: tempAnswer,
                    activeColor: ColorPalette.primary40,
                    title: const Text('No', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600, color: Colors.black)),
                    subtitle: const Text('Get only Cargo orders', style: TextStyle(color: Colors.black54)),
                    onChanged: (value) => setSheetState(() => tempAnswer = value),
                  ),
                  const SizedBox(height: 16),
                  SizedBox(
                    width: double.infinity,
                    height: 52,
                    child: ElevatedButton(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: tempAnswer == null ? ColorPalette.primary80 : ColorPalette.primary40,
                        foregroundColor: Colors.white,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                      onPressed: tempAnswer == null ? null : () => Navigator.pop(sheetContext, tempAnswer),
                      child: const Text('Continue', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
                    ),
                  ),
                ],
              ),
            );
          },
        );
      },
    );

    if (result != null) {
      locator<LoginBloc>().onDrivingLicenseAnswer(result);
    }
  }

  Widget _documentRow({
    required String title,
    required bool unlocked,
    String? actionLabel,
    Color? actionColor,
    IconData? trailingIcon,
    Color? trailingIconColor,
    VoidCallback? onTap,
  }) {
    return InkWell(
      borderRadius: BorderRadius.circular(14),
      onTap: unlocked ? onTap : null,
      child: Container(
        margin: const EdgeInsets.only(bottom: 14),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: Colors.black12),
        ),
        child: Row(
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                      color: unlocked ? Colors.black : Colors.black38,
                    ),
                  ),
                  if (actionLabel != null) ...[
                    const SizedBox(height: 4),
                    Text(
                      actionLabel,
                      style: TextStyle(fontSize: 13, color: actionColor ?? ColorPalette.primary40, fontWeight: FontWeight.w600),
                    ),
                  ],
                ],
              ),
            ),
            Icon(
              trailingIcon ?? (unlocked ? Icons.chevron_right : Icons.lock_outline),
              color: trailingIconColor ?? (unlocked ? Colors.black45 : Colors.black26),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildChecklistBody(BuildContext context) {
    final licenseSubmitted = loginState.licenseSubmitted;
    final hasDrivingLicense = loginState.hasDrivingLicense;
    final profileInfoSubmitted = loginState.profileInfoSubmitted;
    final vehicleRCSubmitted = loginState.vehicleRCSubmitted;

    final licenseActionLabel = licenseSubmitted
        ? 'Under verification...'
        : (hasDrivingLicense == null
            ? 'Upload Now'
            : (hasDrivingLicense ? 'Continue upload' : 'No selected — tap to change'));

    final profileActionLabel = profileInfoSubmitted ? 'Under verification...' : null;

    return Column(
      mainAxisSize: MainAxisSize.max,
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Expanded(
          child: SingleChildScrollView(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    color: ColorPalette.primary40,
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: Row(
                    children: [
                      const Expanded(
                        child: Text(
                          'Please complete all the steps to activate your account',
                          style: TextStyle(color: Colors.white, fontSize: 17, fontWeight: FontWeight.w600),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Container(
                        width: 56,
                        height: 56,
                        decoration: BoxDecoration(
                          color: Colors.white24,
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: const Icon(Icons.badge_outlined, color: Colors.white, size: 28),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 24),
                _documentRow(
                  title: 'Driving License',
                  unlocked: true,
                  actionLabel: licenseActionLabel,
                  actionColor: licenseSubmitted ? Colors.orange : null,
                  trailingIcon: licenseSubmitted ? Icons.error_outline : null,
                  trailingIconColor: licenseSubmitted ? Colors.orange : null,
                  onTap: licenseSubmitted
                      ? null
                      : () {
                          if (hasDrivingLicense == true) {
                            locator<LoginBloc>().onOpenLicenseUpload();
                          } else {
                            _showLicenseSheet(context);
                          }
                        },
                ),
                _documentRow(
                  title: 'Profile Info',
                  unlocked: licenseSubmitted,
                  actionLabel: profileActionLabel,
                  actionColor: profileInfoSubmitted ? Colors.orange : null,
                  trailingIcon: profileInfoSubmitted ? Icons.error_outline : null,
                  trailingIconColor: profileInfoSubmitted ? Colors.orange : null,
                  onTap: profileInfoSubmitted ? null : () => locator<LoginBloc>().onOpenProfileInfo(),
                ),
                _documentRow(
                  title: 'Vehicle RC',
                  unlocked: profileInfoSubmitted,
                  actionLabel: vehicleRCSubmitted ? 'Under verification...' : null,
                  actionColor: vehicleRCSubmitted ? Colors.orange : null,
                  trailingIcon: vehicleRCSubmitted ? Icons.error_outline : null,
                  trailingIconColor: vehicleRCSubmitted ? Colors.orange : null,
                  onTap: vehicleRCSubmitted ? null : () => locator<LoginBloc>().onOpenVehicleRC(),
                ),
                _documentRow(
                  title: 'Aadhaar/PAN card',
                  unlocked: vehicleRCSubmitted,
                  actionLabel: loginState.aadhaarPanSubmitted ? 'Under verification...' : null,
                  actionColor: loginState.aadhaarPanSubmitted ? Colors.orange : null,
                  trailingIcon: loginState.aadhaarPanSubmitted ? Icons.error_outline : null,
                  trailingIconColor: loginState.aadhaarPanSubmitted ? Colors.orange : null,
                  onTap: loginState.aadhaarPanSubmitted ? null : () => locator<LoginBloc>().onOpenAadhaarPan(),
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
              backgroundColor: ColorPalette.primary40,
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            ),
            onPressed: onConfirm,
            child: const Text(
              'Continue',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
            ),
          ),
        ),
        SizedBox(height: embedded ? 8 : 24),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    Widget content;

    if (loginState.showLicenseUpload) {
      content = DrivingLicenseUploadScreen(
        onBack: () => locator<LoginBloc>().onCloseLicenseUpload(),
        onSubmit: () => locator<LoginBloc>().onLicenseSubmitted(),
        initialLicenseNumber: loginState.draftLicenseNumber,
        onLicenseNumberChanged: (number) => locator<LoginBloc>().onDraftLicenseNumberChanged(number),
      );
    } else if (loginState.showProfileInfo) {
      content = ProfileInfoScreen(
        initialFirstName: loginState.draftProfileFirstName ?? loginState.profileFirstName,
        initialLastName: loginState.draftProfileLastName ?? loginState.profileLastName,
        initialDob: loginState.draftProfileDob ?? loginState.profileDob,
        initialGender: loginState.draftProfileGender ?? loginState.profileGender,
        onDraftChanged: ({firstName, lastName, dob, gender}) => locator<LoginBloc>().onDraftProfileChanged(
          firstName: firstName,
          lastName: lastName,
          dob: dob,
          gender: gender,
        ),
        onSubmit: (firstName, lastName, dob, gender) => locator<LoginBloc>().onProfileInfoSubmitted(
          firstName: firstName,
          lastName: lastName,
          dob: dob,
          gender: gender,
        ),
      );
    } else if (loginState.showVehicleRC) {
      content = VehicleRCScreen(
        initialOwnership: loginState.draftVehicleOwnership,
        initialVehicleNumber: loginState.draftVehicleNumber,
        onDraftChanged: ({ownership, vehicleNumber}) {
          if (ownership != null) locator<LoginBloc>().onDraftVehicleOwnershipChanged(ownership);
          if (vehicleNumber != null) locator<LoginBloc>().onDraftVehicleNumberChanged(vehicleNumber);
        },
        onSubmit: (ownership, vehicleNumber) => locator<LoginBloc>().onVehicleRCSubmitted(
          ownership: ownership,
          vehicleNumber: vehicleNumber,
        ),
      );
    } else if (loginState.showAadhaarPan) {
      content = AadhaarPanScreen(
        initialAadhaarNumber: loginState.draftAadhaarNumber,
        initialPanNumber: loginState.draftPanNumber,
        onDraftChanged: ({aadhaarNumber, panNumber}) {
          if (aadhaarNumber != null) locator<LoginBloc>().onDraftAadhaarNumberChanged(aadhaarNumber);
          if (panNumber != null) locator<LoginBloc>().onDraftPanNumberChanged(panNumber);
        },
        onSubmit: (aadhaarNumber, panNumber) => locator<LoginBloc>().onAadhaarPanSubmitted(
          aadhaarNumber: aadhaarNumber,
          panNumber: panNumber,
        ),
      );
    } else {
      content = Builder(builder: _buildChecklistBody);
    }

    if (embedded) {
      return LayoutBuilder(
        builder: (context, constraints) {
          return ConstrainedBox(
            constraints: BoxConstraints(minHeight: constraints.maxHeight),
            child: content,
          );
        },
      );
    }

    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20),
          child: content,
        ),
      ),
    );
  }
}
