import 'package:api_response/api_response.dart';
import 'package:graphql/client.dart';
import 'package:injectable/injectable.dart';
import 'package:ridy/core/graphql/documents/home.graphql.dart';
import 'package:ridy/core/graphql/documents/track_order.graphql.dart';
import 'package:ridy/core/datasources/graphql_datasource.dart';
import 'package:flutter_common/features/chat/chat.dart';
import 'package:ridy/core/graphql/documents/wallet.graphql.dart';

import '../../domain/repositories/track_order_repository.dart';

@prod
@LazySingleton(as: TrackOrderRepository)
class TrackOrderRepositoryImpl implements TrackOrderRepository {
  final GraphqlDatasource graphQLDatasource;
  final List<ChatMessageEntity> messagesSent = [];

  TrackOrderRepositoryImpl(
    this.graphQLDatasource,
  );

  @override
  Future<ApiResponse<Query$CancelReasons>> getCancelReasons() async {
    final cancelReasonsResponse = await graphQLDatasource.query(
      Options$Query$CancelReasons(),
    );
    return cancelReasonsResponse;
  }

  @override
  Future<ApiResponse<Mutation$SendSOS>> sendSOSSignal({
    required String orderId,
  }) async {
    final sendSOSSignalResponse = await graphQLDatasource.mutate(Options$Mutation$SendSOS(
      variables: Variables$Mutation$SendSOS(
        orderId: orderId,
      ),
    ));
    return sendSOSSignalResponse;
  }

  @override
  Future<ApiResponse<Query$PaymentMethods>> getPaymentMethods() async {
    final paymentMethodsResponse = await graphQLDatasource.query(
      Options$Query$PaymentMethods(
        fetchPolicy: FetchPolicy.noCache,
      ),
    );
    return paymentMethodsResponse;
  }

  @override
  Future<ApiResponse<Mutation$CreateRazorpayRideOrder>> createRazorpayRideOrder({
    required String orderId,
  }) async {
    return graphQLDatasource.mutate(
      Options$Mutation$CreateRazorpayRideOrder(
        variables: Variables$Mutation$CreateRazorpayRideOrder(
          orderId: orderId,
        ),
      ),
    );
  }

  @override
  Future<ApiResponse<Mutation$VerifyRazorpayRidePayment>> verifyRazorpayRidePayment({
    required String orderId,
    required String razorpayOrderId,
    required String razorpayPaymentId,
    required String razorpaySignature,
  }) async {
    return graphQLDatasource.mutate(
      Options$Mutation$VerifyRazorpayRidePayment(
        variables: Variables$Mutation$VerifyRazorpayRidePayment(
          orderId: orderId,
          razorpayOrderId: razorpayOrderId,
          razorpayPaymentId: razorpayPaymentId,
          razorpaySignature: razorpaySignature,
        ),
      ),
    );
  }
}
