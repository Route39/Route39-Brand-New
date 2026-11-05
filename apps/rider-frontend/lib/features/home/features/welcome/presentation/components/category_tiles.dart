import 'dart:async';
import 'package:flutter/material.dart';
import 'package:graphql/client.dart';
import 'package:ridy/config/locator/locator.dart';
import 'package:ridy/core/blocs/home.bloc.dart';
import 'package:ridy/core/graphql/documents/service_categories.graphql.dart';
import '../premium_notifier.dart';

class CategoryTiles extends StatefulWidget {
  const CategoryTiles({super.key});
  @override
  State<CategoryTiles> createState() => _CategoryTilesState();
}

class _CategoryTilesState extends State<CategoryTiles> {
  static List<Query$ServiceCategories$serviceCategories>? _cache;
  List<Query$ServiceCategories$serviceCategories> _items = _cache ?? [];
  bool _loading = _cache == null;
  bool _inBangalore = false;
  StreamSubscription? _sub;

  @override
  void dispose() {
    _sub?.cancel();
    super.dispose();
  }

  bool _isEv(Query$ServiceCategories$serviceCategories c) {
    final n = c.name.toLowerCase();
    return RegExp(r'\bev\b').hasMatch(n) && !n.contains('auto') && !_isCargo(c);
  }

  bool _computeBangalore(dynamic state) {
    try {
      final place = state.currentLocationResponse.data;
      if (place == null) return false;
      final addr = (place.address ?? '').toString().toLowerCase();
      if (addr.contains('bangalore') || addr.contains('bengaluru') || addr.contains('bengalooru')) return true;
      final lat = place.latLng.latitude as double;
      final lng = place.latLng.longitude as double;
      return lat >= 12.8 && lat <= 13.2 && lng >= 77.4 && lng <= 77.8;
    } catch (_) {
      return false;
    }
  }

  void _updateCity(dynamic state) {
    final b = _computeBangalore(state);
    if (b == _inBangalore) return;
    _inBangalore = b;
    if (mounted) setState(() {});
    _enforce();
  }

  void _enforce() {
    if (_inBangalore || _items.isEmpty) return;
    final sel = _items.where((c) => c.id == selectedCategoryIdNotifier.value).toList();
    if (sel.isEmpty || _isEv(sel.first)) {
      final firstOk = _items.where((c) => !_isEv(c)).toList();
      if (firstOk.isNotEmpty) _select(firstOk.first);
    }
  }

  @override
  void initState() {
    super.initState();
    _updateCity(locator<HomeBloc>().state);
    _sub = locator<HomeBloc>().stream.listen(_updateCity);
    _load();
  }

  bool _isCargo(Query$ServiceCategories$serviceCategories c) => c.name.toLowerCase().contains('cargo');

  Future<void> _load() async {
    try {
      final res = await locator<GraphQLClient>().query$ServiceCategories(
        Options$Query$ServiceCategories(fetchPolicy: FetchPolicy.networkOnly),
      );
      final all = res.parsedData?.serviceCategories ?? [];
      final list = all.where((c) => c.services.isNotEmpty).toList();
      _cache = list;
      if (mounted == false) return;
      setState(() { _items = list; _loading = false; });
      final keep = list.any((c) => c.id == selectedCategoryIdNotifier.value);
      if (list.isNotEmpty && keep == false) {
        final ok = list.where((c) => _inBangalore || !_isEv(c)).toList();
        _select(ok.isNotEmpty ? ok.first : list.first);
      }
      _enforce();
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  void _select(Query$ServiceCategories$serviceCategories c) {
    if (_isEv(c) && !_inBangalore) return;
    selectedCategoryIdNotifier.value = c.id;
    selectedServiceIdNotifier.value = null;
    premiumSelectedNotifier.value = false;
    locator<HomeBloc>().add(const HomeEvent.onRideOptionSelected());
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const SizedBox(height: 104, child: Center(child: CircularProgressIndicator(strokeWidth: 2)));
    }
    if (_items.isEmpty) return const SizedBox.shrink();
    final per = _items.length < 3 ? _items.length : 3;
    final w = (MediaQuery.of(context).size.width - 32 - 10 * (per - 1)) / per;
    return ValueListenableBuilder<String?>(
      valueListenable: selectedCategoryIdNotifier,
      builder: (context, selId, _) => SizedBox(
        height: 110,
        child: ListView.separated(
          scrollDirection: Axis.horizontal,
          itemCount: _items.length,
          separatorBuilder: (_, __) => const SizedBox(width: 10),
          itemBuilder: (context, i) {
            final c = _items[i];
            final locked = _isEv(c) && !_inBangalore;
            final selected = selId == c.id && !locked;
            final url = c.media?.address ?? (c.services.isEmpty ? null : c.services.first.media?.address);
            return GestureDetector(
              onTap: locked ? null : () => _select(c),
              child: Container(
                width: w,
                padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 4),
                decoration: BoxDecoration(
                  color: locked ? Colors.grey.shade200 : Colors.white,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: selected ? Colors.red : Colors.grey.shade300, width: selected ? 2 : 1),
                ),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    locked
                        ? SizedBox(
                            height: 44,
                            child: Image.asset('assets/images/car_moving.png', width: 72, fit: BoxFit.contain),
                          )
                        : (url == null
                            ? Image.asset('assets/images/ev_auto_icon.png', height: 44, fit: BoxFit.contain)
                            : Image.network(url, height: 44, fit: BoxFit.contain,
                                errorBuilder: (_, __, ___) => Image.asset('assets/images/ev_auto_icon.png', height: 44))),
                    const SizedBox(height: 6),
                    Text(c.name, maxLines: 2, textAlign: TextAlign.center, overflow: TextOverflow.ellipsis,
                        style: TextStyle(fontWeight: FontWeight.w600, fontSize: 13,
                            color: selected ? Colors.black : Colors.black54)),
                    if (locked)
                      Container(
                        margin: const EdgeInsets.only(top: 4),
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                        decoration: BoxDecoration(color: Colors.orange.shade100, borderRadius: BorderRadius.circular(8)),
                        child: const Text('Launching soon', style: TextStyle(fontSize: 10, fontWeight: FontWeight.w600, color: Colors.deepOrange)),
                      ),
                  ],
                ),
              ),
            );
          },
        ),
      ),
    );
  }
}
