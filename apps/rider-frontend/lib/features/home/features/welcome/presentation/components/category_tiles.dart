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

  @override
  void initState() {
    super.initState();
    _load();
  }

  bool _isCargo(Query$ServiceCategories$serviceCategories c) => c.name.toLowerCase().contains('cargo');

  Future<void> _load() async {
    try {
      final res = await locator<GraphQLClient>().query$ServiceCategories(
        Options$Query$ServiceCategories(fetchPolicy: FetchPolicy.networkOnly),
      );
      final all = res.parsedData?.serviceCategories ?? [];
      final list = all.where((c) => _isCargo(c) == false && c.services.isNotEmpty).toList();
      _cache = list;
      if (mounted == false) return;
      setState(() { _items = list; _loading = false; });
      final keep = list.any((c) => c.id == selectedCategoryIdNotifier.value);
      if (list.isNotEmpty && keep == false) _select(list.first);
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  void _select(Query$ServiceCategories$serviceCategories c) {
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
            final selected = selId == c.id;
            final url = c.media?.address ?? (c.services.isEmpty ? null : c.services.first.media?.address);
            return GestureDetector(
              onTap: () => _select(c),
              child: Container(
                width: w,
                padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 4),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: selected ? Colors.red : Colors.grey.shade300, width: selected ? 2 : 1),
                ),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    url == null
                        ? Image.asset('assets/images/ev_auto_icon.png', height: 44, fit: BoxFit.contain)
                        : Image.network(url, height: 44, fit: BoxFit.contain,
                            errorBuilder: (_, __, ___) => Image.asset('assets/images/ev_auto_icon.png', height: 44)),
                    const SizedBox(height: 6),
                    Text(c.name, maxLines: 2, textAlign: TextAlign.center, overflow: TextOverflow.ellipsis,
                        style: TextStyle(fontWeight: FontWeight.w600, fontSize: 13,
                            color: selected ? Colors.black : Colors.black54)),
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
