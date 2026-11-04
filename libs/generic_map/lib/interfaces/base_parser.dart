import 'package:generic_map/interfaces/heat_map_config.dart';

import 'interfaces.dart';

abstract class BaseParser<MarkerType, CircleType, PolyLineType, HeatmapType> {
  List<MarkerType> parseMarkers(List<CustomMarker> marker);
  List<CircleType> parseCircleMarkers(List<CircleMarker> marker);
  List<PolyLineType> parsePolyLines(List<PolyLineLayer> polyLine);

  List<HeatmapType> parseHeatmap(List<HeatmapConfig> heatmap);
}
