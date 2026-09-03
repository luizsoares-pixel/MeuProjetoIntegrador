declare module "supercluster" {
  export interface PointGeometry {
    type: "Point";
    coordinates: [number, number];
  }

  export interface ClusterProperties {
    cluster: true;
    cluster_id: number;
    point_count: number;
    point_count_abbreviated: string | number;
  }

  export interface PointFeature<Properties> {
    type: "Feature";
    id?: number | string;
    geometry: PointGeometry;
    properties: Properties & { cluster?: false };
  }

  export interface ClusterFeature<ClusterCustomProperties = ClusterProperties> {
    type: "Feature";
    id: number;
    geometry: PointGeometry;
    properties: ClusterCustomProperties;
  }

  export type ClusterOrPoint<
    Properties,
    ClusterCustomProperties = ClusterProperties
  > = ClusterFeature<ClusterCustomProperties> | PointFeature<Properties>;

  export interface Options<Properties, ClusterCustomProperties> {
    minZoom?: number;
    maxZoom?: number;
    minPoints?: number;
    radius?: number;
    extent?: number;
    nodeSize?: number;
    log?: boolean;
    generateId?: boolean;
    map?: (props: Properties) => ClusterCustomProperties;
    reduce?: (
      accumulated: ClusterCustomProperties,
      props: ClusterCustomProperties
    ) => void;
  }

  export default class Supercluster<
    Properties = Record<string, any>,
    ClusterCustomProperties = ClusterProperties
  > {
    constructor(options?: Options<Properties, ClusterCustomProperties>);
    load(
      points: Array<PointFeature<Properties>>
    ): Supercluster<Properties, ClusterCustomProperties>;
    getClusters(
      bbox: [number, number, number, number],
      zoom: number
    ): Array<ClusterOrPoint<Properties, ClusterCustomProperties>>;
    getClusterExpansionZoom(clusterId: number): number;
  }
}

