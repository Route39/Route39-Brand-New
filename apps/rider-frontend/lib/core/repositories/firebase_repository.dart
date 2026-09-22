abstract class FirebaseRepository {
  Future<void> retrieveAndUpdateFcmToken();
  Future<void> initializeNotificationListener();
}
